# **App Name**: VolumeVision

## Core Features:

- Real-time Glass Detection: Utilize the device camera and a machine learning model (e.g., TFLite, YOLO) to identify drinking glasses in real time, marking them with a bounding box.
- Liquid Level Segmentation: Segment the glass and liquid level within the bounding box to accurately determine the liquid-air boundary using semantic segmentation. Using the segmentation output, estimate the glass dimensions
- Volume Calculation: Infer glass scale and apply appropriate volumetric formulas based on detected glass shape to compute total and current liquid volume.
- Real-time Volume Overlay: Display calculated current volume (in ml or oz) as a live, updating text overlay on the camera view next to the detected glass. Volume output also displays "confidence score", derived from LLM tool evaluating if the shape, the water line are consistent
- Unit Selection: Allow users to switch between milliliters (mL) and ounces (oz) for volume display via a simple settings menu.

## Style Guidelines:

- Primary color: Dark blue (#34495E) for a professional, precise feel.
- Background color: Very light gray (#F0F3F4), almost white, for a clean interface.
- Accent color: Teal (#2ECC71) for highlights and interactive elements to ensure visibility against the dark primary color and light background.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for its modern and neutral appearance suitable for a technical application.
- Use simple, line-based icons to maintain a clean and unobtrusive interface.
- Subtle, brief animations or transitions to highlight volume updates and confirm glass detection.