import os
from PIL import Image

def generate_icons():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    png_path = os.path.join(root_dir, 'build', 'icon.png')
    ico_path = os.path.join(root_dir, 'build', 'icon.ico')
    assets_dir = os.path.join(root_dir, 'src', 'renderer', 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    asset_png_path = os.path.join(assets_dir, 'icon.png')

    if not os.path.exists(png_path):
        print(f"Error: {png_path} not found.")
        return

    img = Image.open(png_path)
    
    # Ensure RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Save to src/renderer/assets/icon.png (128x128 for UI)
    img.resize((128, 128), Image.Resampling.LANCZOS).save(asset_png_path, format='PNG')

    # Save multi-resolution Windows ICO
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(ico_path, format='ICO', sizes=icon_sizes)

    print(f"Success! Generated {ico_path} and {asset_png_path} from {png_path}")

if __name__ == '__main__':
    generate_icons()
