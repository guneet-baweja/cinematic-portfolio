import os
os.environ['USE_TF'] = '0'
os.environ['USE_TORCH'] = '1'
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision.models.segmentation import deeplabv3_mobilenet_v3_large, DeepLabV3_MobileNet_V3_Large_Weights

def main():
    src_path = '/Users/guneetbaweja/Downloads/dp insta.png'
    out_dir = '/Users/guneetbaweja/Desktop/cinematic-portfolio/public/assets/genesis'
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"Loading source image from {src_path}...")
    pil_img = Image.open(src_path).convert('RGB')
    w, h = pil_img.size
    img_bgr = cv2.imread(src_path)
    
    # 1. Run DeepLabV3
    weights = DeepLabV3_MobileNet_V3_Large_Weights.DEFAULT
    model = deeplabv3_mobilenet_v3_large(weights=weights).eval()
    preprocess = weights.transforms()
    input_tensor = preprocess(pil_img).unsqueeze(0)
    
    with torch.no_grad():
        output = model(input_tensor)['out'][0]
    preds = output.argmax(0).byte().cpu().numpy()
    dlv3_mask = (preds == 15).astype(np.uint8) * 255
    dlv3_mask = cv2.resize(dlv3_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    
    # 2. Chroma-key isolation of bright blue backdrop
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    # The blue studio backdrop has V > 140, S > 80; the dark navy shirt has V ~ 53
    blue_bg = cv2.inRange(hsv, np.array([90, 80, 140]), np.array([135, 255, 255]))
    
    # Circle bounds
    Y, X = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((X - 546)**2 + (Y - 733)**2)
    circle_mask = (dist_from_center <= 544).astype(np.uint8) * 255
    
    # Subject is inside circle where NOT blue, PLUS any hair detected by dlv3 above the circle
    inside_circle_subject = cv2.bitwise_and(circle_mask, cv2.bitwise_not(blue_bg))
    
    # Combine with DeepLabV3
    combined_mask = np.maximum(inside_circle_subject, dlv3_mask)
    
    # Remove isolated blue pixels
    combined_mask[blue_bg > 0] = 0
    
    # Morphological closing to fill shirt and hair texture solidly
    kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    closed_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel_large)
    
    # Extract largest component
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats((closed_mask > 50).astype(np.uint8))
    largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    solid_person = (labels == largest_label).astype(np.uint8) * 255
    
    # Smooth edge with bilateral blur / Gaussian blur for pristine antialiasing
    blurred_alpha = cv2.GaussianBlur(solid_person, (7, 7), 2.0).astype(np.float32) / 255.0
    
    # Composite RGBA
    b, g, r = cv2.split(img_bgr)
    rgba = cv2.merge([b, g, r, (blurred_alpha * 255).astype(np.uint8)])
    
    # Crop to bounding box
    ys, xs = np.where(solid_person > 10)
    ymin, ymax = max(0, np.min(ys) - 15), min(h, np.max(ys) + 15)
    xmin, xmax = max(0, np.min(xs) - 15), min(w, np.max(xs) + 15)
    cropped_rgba = rgba[ymin:ymax, xmin:xmax]
    ch, cw = cropped_rgba.shape[:2]
    
    target_dim = 1024
    scale = target_dim / max(cw, ch)
    nw, nh = int(cw * scale), int(ch * scale)
    resized_rgba = cv2.resize(cropped_rgba, (nw, nh), interpolation=cv2.INTER_AREA)
    
    final_portrait = np.zeros((target_dim, target_dim, 4), dtype=np.uint8)
    off_x = (target_dim - nw) // 2
    off_y = (target_dim - nh) // 2
    final_portrait[off_y:off_y+nh, off_x:off_x+nw] = resized_rgba
    
    cutout_path = os.path.join(out_dir, 'portrait-cutout.png')
    cv2.imwrite(cutout_path, final_portrait)
    print(f"Saved refined portrait cutout to {cutout_path}")
    
    # 3. Generate Smooth Volumetric 2.5D Depth Map
    alpha_channel = final_portrait[:, :, 3]
    binary_mask = (alpha_channel > 50).astype(np.uint8)
    
    dist = cv2.distanceTransform(binary_mask, cv2.DIST_L2, 5)
    max_dist = np.max(dist) if np.max(dist) > 0 else 1.0
    norm_dist = dist / max_dist
    
    # Anatomical facial dome
    face_cx = off_x + nw * 0.50
    face_cy = off_y + nh * 0.38
    xx, yy = np.meshgrid(np.arange(target_dim), np.arange(target_dim))
    face_dist = np.sqrt(((xx - face_cx) / (nw * 0.22)) ** 2 + ((yy - face_cy) / (nh * 0.26)) ** 2)
    face_dome = np.clip(1.0 - face_dist, 0, 1) ** 1.8
    
    nose_cy = face_cy + nh * 0.04
    nose_dist = np.sqrt(((xx - face_cx) / (nw * 0.06)) ** 2 + ((yy - nose_cy) / (nh * 0.08)) ** 2)
    nose_bump = np.clip(1.0 - nose_dist, 0, 1) ** 2.0 * 0.35
    
    y_coords = np.linspace(0, 1, target_dim)[:, None]
    body_relief = np.exp(-((y_coords - 0.35) ** 2) / 0.18)
    
    composite_depth = (
        norm_dist * 0.45 +
        face_dome * 0.35 +
        nose_bump +
        body_relief * 0.15
    ) * (alpha_channel.astype(np.float32) / 255.0)
    
    composite_depth = np.clip(composite_depth, 0, 1.0)
    depth_smooth = cv2.GaussianBlur((composite_depth * 255).astype(np.uint8), (7, 7), 2.0)
    depth_smooth = np.where(binary_mask > 0, depth_smooth, 0)
    
    depth_path = os.path.join(out_dir, 'portrait-depth.png')
    cv2.imwrite(depth_path, depth_smooth)
    print(f"Saved refined portrait depth map to {depth_path}")

if __name__ == '__main__':
    main()
