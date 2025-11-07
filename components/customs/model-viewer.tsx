import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface ThreeModelViewerProps {
  file: string;
  model_x?: number;
  model_y?: number;
  model_z?: number;
  model_size?: number;
  cam_x?: number;
  cam_y?: number;
  cam_z?: number;
  space_width?: string | number;
  space_height?: string | number;
  can_mouse?: boolean;
  can_zoom?: boolean;
  bg?: string;
  light_x?: number;
  light_y?: number;
  light_z?: number;
  light_color?: string;
  light_power?: number;
}

/**
 * Props:
 * file: string (file name of model without path)
 * model_x, model_y, model_z: number (position)
 * model_size: number (scale)
 * cam_x, cam_y, cam_z: number (camera position)
 * space_width, space_height: string | number (Tailwind class like "w-full", "w-sm", or CSS unit like "100%", "50vw", or number in px)
 * can_mouse: boolean (right-click rotate)
 * can_zoom: boolean (zoom or not)
 * bg: string color background, default white
 * light_x, light_y, light_z: number (directional light position)
 * light_color: string (light color in hex format like "#ffffff" or "0xffffff", default "#ffffff")
 * light_power: number (light intensity/power, default 0.5)
 */

// Helper function to parse width/height value
function parseSizeValue(value: string | number): { className?: string; style?: string | number } {
  if (typeof value === 'number') {
    return { style: value };
  }
  
  // Check if it's a Tailwind width class (w-*)
  if (value.startsWith('w-')) {
    return { className: value };
  }
  
  // Check if it's a Tailwind height class (h-*)
  if (value.startsWith('h-')) {
    return { className: value };
  }
  
  // Otherwise treat as CSS unit
  return { style: value };
}

// Helper function to get width className and style
function getWidthProps(value: string | number): { className?: string; style?: React.CSSProperties } {
  const parsed = parseSizeValue(value);
  if (parsed.className) {
    return { className: parsed.className };
  }
  return { style: { width: parsed.style as string | number } };
}

// Helper function to get height className and style
function getHeightProps(value: string | number): { className?: string; style?: React.CSSProperties } {
  const parsed = parseSizeValue(value);
  if (parsed.className) {
    return { className: parsed.className };
  }
  return { style: { height: parsed.style as string | number } };
}

// Helper function to convert color string to number
// Supports: hex (3, 4, 6, 8 digits), rgb, rgba, hsl, hsla, oklch, color names
function parseColor(color: string): number {
  try {
    // Check if it's OKLCH format (THREE.Color doesn't support it natively)
    const trimmedColor = color.trim().toLowerCase();
    if (trimmedColor.startsWith('oklch')) {
      // Convert OKLCH to RGB using browser's CSS color parsing
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          // Create a temporary element off-screen to parse the color
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.color = color;
          document.body.appendChild(tempDiv);
          
          const computedColor = window.getComputedStyle(tempDiv).color;
          document.body.removeChild(tempDiv);
          
          // Parse rgb(r, g, b) or rgba(r, g, b, a) format
          const rgbMatch = computedColor.match(/\d+/g);
          if (rgbMatch && rgbMatch.length >= 3) {
            const r = parseInt(rgbMatch[0], 10);
            const g = parseInt(rgbMatch[1], 10);
            const b = parseInt(rgbMatch[2], 10);
            return (r << 16) | (g << 8) | b;
          }
        } catch (e) {
          // If OKLCH parsing fails, fall through to default
        }
      }
      // Fallback if browser doesn't support OKLCH or parsing fails
      return 0xffffff;
    }
    
    // Use THREE.Color to parse various color formats
    // THREE.Color supports: hex, rgb, hsl, and CSS color names
    const threeColor = new THREE.Color(color);
    return threeColor.getHex();
  } catch (error) {
    // Fallback: try to parse as hex
    let hexString = color.trim();
    
    // Remove # if present
    if (hexString.startsWith('#')) {
      hexString = hexString.slice(1);
    }
    
    // Remove 0x if present
    if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
      hexString = hexString.slice(2);
    }
    
    // Handle hex strings of different lengths
    if (hexString.length === 3 || hexString.length === 4) {
      // Expand short hex: #abc -> #aabbcc
      hexString = hexString.split('').map(char => char + char).join('');
    }
    
    // For 8-digit hex (with alpha), use only first 6 digits for RGB
    if (hexString.length >= 6) {
      hexString = hexString.slice(0, 6);
    }
    
    const parsed = parseInt(hexString, 16);
    return isNaN(parsed) ? 0xffffff : parsed;
  }
}

export default function ThreeModelViewer({
  file,
  model_x = 0,
  model_y = 0,
  model_z = 0,
  model_size = 1,
  cam_x = 2,
  cam_y = 2,
  cam_z = 2,
  space_width = "100%",
  space_height = "100%",
  can_mouse = true,
  can_zoom = true,
  bg = "#ffffff",
  light_x = 0,
  light_y = 100,
  light_z = 0,
  light_color = "#ffffff",
  light_power = 3,
}: ThreeModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 300 });

  // Handle resize observer to track container dimensions
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const updateDimensions = () => {
      const rect = mount.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Create ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(mount);

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [space_width, space_height]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Don't load if file is empty or undefined
    if (!file || file.trim() === '') {
      setError("ไม่มีไฟล์ model");
      return;
    }

    setError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);

    const { width, height } = dimensions;
    const aspect = width / height;

    const camera = new THREE.PerspectiveCamera(
      75,
      aspect,
      0.1,
      1000
    );
    camera.position.set(cam_x, cam_y, cam_z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    
    // Set cursor styles for grab/grabbing
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Add directional light with custom properties
    const lightColorValue = parseColor(light_color);
    const directionalLight = new THREE.DirectionalLight(lightColorValue, light_power);
    directionalLight.position.set(light_x, light_y, light_z);
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = can_mouse;
    controls.enableZoom = can_zoom;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controlsRef.current = controls;

    // Track mouse state for cursor changes
    let isDragging = false;
    let isRightButton = false;

    // Set cursor to grabbing when starting drag with right click
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2) { // Right click
        isRightButton = true;
        isDragging = true;
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    // Set cursor back to grab on mouse up
    const handleMouseUp = () => {
      if (isRightButton) {
        isDragging = false;
        isRightButton = false;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    // Set cursor to grab on mouse leave
    const handleMouseLeave = () => {
      isDragging = false;
      isRightButton = false;
      renderer.domElement.style.cursor = 'grab';
    };

    // Handle mouse move to maintain grabbing cursor while dragging
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && isRightButton && event.buttons === 2) {
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);
    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Load model from /shapes/
    const loader = new GLTFLoader();
    let model: THREE.Group | null = null;

    loader.load(
      `/shapes/${file}`,
      (gltf) => {
        model = gltf.scene;
        model.position.set(model_x, model_y, model_z);
        model.scale.set(model_size, model_size, model_size);
        scene.add(model);

        // Calculate bounding box and center the camera
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Update controls target to center of model
        controls.target.copy(center);
        controls.update();

        // Adjust camera position to fit the model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Add some padding

        camera.position.set(center.x + cam_x, center.y + cam_y, center.z + cameraZ);
        camera.lookAt(center);
        controls.update();
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        const errorMessage = error instanceof Error ? error.message : 'ไฟล์ไม่พบ';
        setError(`ไม่สามารถโหลด model: ${errorMessage}`);
      }
    );

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [file, model_x, model_y, model_z, model_size, cam_x, cam_y, cam_z, dimensions.width, dimensions.height, can_mouse, can_zoom, bg, light_x, light_y, light_z, light_color, light_power]);

  // Update renderer and camera when dimensions change
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !controlsRef.current) return;
    
    const { width, height } = dimensions;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current.update();
  }, [dimensions]);

  const widthProps = getWidthProps(space_width);
  const heightProps = getHeightProps(space_height);

  const containerClassName = [widthProps.className, heightProps.className].filter(Boolean).join(' ');
  const containerStyle = {
    ...widthProps.style,
    ...heightProps.style,
  };

  if (error) {
    return (
      <div 
        className={containerClassName}
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          color: '#666',
          fontSize: '14px'
        }}
      >
        {error}
      </div>
    );
  }

  return <div ref={mountRef} className={containerClassName} style={containerStyle} />;
}
