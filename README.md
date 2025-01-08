# Pack3D

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Release](https://github.com/notmike101/pack3d/actions/workflows/electronbuild.yml/badge.svg)](https://github.com/notmike101/pack3d/actions/workflows/electronbuild.yml)

Pack3D is a powerful and user-friendly tool designed to optimize 3D models (specifically GLTF/GLB files). It leverages modern compression techniques to significantly reduce model file size without compromising visual quality, making them ideal for web and other performance-sensitive applications.

**Currently, only Windows 10+ is supported.**

## Features

Pack3D offers a comprehensive suite of optimization features, including:

*   **Deduplication:** Removes redundant vertex data, reducing file size.
*   **Reordering:** Reorders vertices for better compression efficiency.
*   **Welding:** Merges nearby vertices to further reduce vertex count.
*   **Instancing:** Leverages instancing to reduce the size of models with repeated geometry.
*   **Texture Resizing:** Resizes textures to specified dimensions, with options for resampling filters (Lanczos3, Lanczos2).
*   **Texture Compression:** Supports advanced texture compression using Basis Universal:
    *   **PNG:** Simple fallback to PNG compression
    *   **ETC1S:** Offers high compression ratios with good quality for a wide range of platforms.
    *   **UASTC:** Provides higher quality than ETC1S but with larger file sizes.
*   **Vertex Compression:** Compresses mesh data with Draco compression, configurable with various quantization parameters.
    *   **Edgebreaker/Sequential Methods:** Choose between these two methods for encoding topology.
    *   **Quantization Volume:** Define quantization precision over the entire scene or per mesh.
    *   **Quantization Bits:** Set the number of bits used for quantizing colors, normals, texture coordinates, etc.

## Why Use Pack3D?

*   **Reduced File Size:** Dramatically shrinks 3D model file sizes, leading to faster load times and reduced bandwidth consumption.
*   **Improved Performance:** Optimized models load and render more efficiently, enhancing user experience, especially on web and mobile platforms.
*   **Easy to Use:** Intuitive graphical interface makes optimization accessible to users of all levels.
*   **Customizable:** Fine-tune optimization settings to achieve the desired balance between file size and visual fidelity.

## Installation

1. **Download the Latest Release:** Head to the [Releases](https://github.com/notmike101/pack3d/releases) section and download the latest installer for Windows (Pack3D.exe).
2. **Run the Installer:** Execute the downloaded installer and follow the on-screen instructions to install Pack3D.

## Usage

1. **Launch Pack3D:** Open the application after installation.
2. **Drag and Drop:** Simply drag and drop your GLTF/GLB model file into the Pack3D window.
3. **Configure Options:**
    *   **General Options:** Enable/disable deduplication, reordering, welding, and instancing.
    *   **Texture Options:** Control texture resizing and compression settings.
    *   **Vertex Compression Options:** Configure Draco compression parameters, including quantization.
4. **Pack:** Click the "Pack" button to start the optimization process.
5. **View Results:** Once complete, Pack3D will display the optimized model alongside the original, allowing for visual comparison. File size savings are also shown.

## Building from Source

If you prefer to build Pack3D from source, follow these steps:

1. **Prerequisites:**
    *   Node.js (v18.12.0 or later)
    *   pnpm (v7.22.0 or later)
    *   Git

2. **Clone the Repository:**

    ```bash
    git clone https://github.com/notmike101/pack3d.git
    ```

3. **Navigate to the Project Directory:**

    ```bash
    cd pack3d
    ```

4. **Install Dependencies:**

    ```bash
    pnpm install
    ```

5. **Build the Application:**

    ```bash
    pnpm run build
    ```

6. **Package the Application:**

    ```bash
    pnpm run release:nopublish
    ```

    The built application will be located in the `release` directory.

## Development

To run the application in development mode with hot-reloading:

```bash
pnpm run dev
```

## Project Structure and Dependencies

Pack3D is built using Electron, Vue 3, and Vite. Here's a breakdown of the project structure and key dependencies:

### Directory Structure

```
pack3d/
├── .github/                # GitHub Actions workflows
│   └── workflows/
│       └── electronbuild.yml # Workflow for building releases
├── ktx2_bins/              # Binaries for KTX2 texture compression (toktx)
├── packages/
│   ├── main/               # Electron main process code
│   │   ├── index.ts        # Main process entry point
│   │   └── vite.config.ts  # Vite configuration for the main process
│   ├── pack-worker/        # Web Worker for glTF packing operations
│   │   ├── index.ts        # Worker entry point
│   │   ├── utils.ts        # Utility functions for the worker
│   │   ├── Logger.ts       # Logging utility
│   │   ├── constants.ts    # Constants for texture compression
│   │   └── vite.config.ts  # Vite configuration for the worker
│   └── renderer/           # Vue.js renderer process (UI)
│       ├── public/         # Static assets (wasm, images)
│       ├── src/
│       │   ├── components/ # Vue components
│       │   ├── assets/     # Assets like CSS and Lottie animation
│       │   ├── App.vue     # Root Vue component
│       │   ├── main.ts     # Renderer process entry point
│       │   ├── utils.ts    # Utility functions
│       │   ├── env.d.ts    # TypeScript definitions
│       │   └── global.d.ts # Global TypeScript definitions
│       ├── index.html      # HTML template
│       ├── tsconfig.json   # TypeScript configuration for the renderer
│       └── vite.config.ts  # Vite configuration for the renderer
├── scripts/                # Build and development scripts
│   ├── build.mjs           # Build script
│   └── watch.mjs           # Development watch script
├── .npmrc                  # npm configuration
├── electron-builder.json   # Configuration for electron-builder
├── package.json            # Project metadata and dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # Root TypeScript configuration
├── types.d.ts              # Global TypeScript type definitions
├── LICENSE.txt             # Project license
└── README.md               # This file
```

### Key Dependencies

*   **Electron:**
    *   `electron`: The core Electron framework for building cross-platform desktop applications.
    *   `electron-builder`: Used for packaging and building distributable versions of the application.
    *   `electron-store`: Simple data persistence for storing user preferences.
    *   `electron-updater`: Enables automatic updates for the application.
*   **Vue.js:**
    *   `vue`: The progressive JavaScript framework used for building the user interface.
    *   `vue-tsc`: TypeScript compiler for Vue.js.
*   **Vite:**
    *   `vite`: A fast build tool and development server.
    *   `@vitejs/plugin-vue`: Vite plugin for Vue.js support.
    *   `vite-plugin-electron`: Vite plugin for Electron integration.
    *   `vite-plugin-electron-renderer`: Vite plugin for using Node.js APIs in the renderer process.
    *   `vite-plugin-static-copy`: Vite plugin to copy static assets such as the WASM dependencies.
*   **3D Model Processing:**
    *   `@babylonjs/core`: Core library of the Babylon.js framework for displaying 3D models.
    *   `@babylonjs/loaders`: Loaders for various 3D model formats, including glTF.
    *   `@gltf-transform/core`: Core library for reading, manipulating, and writing glTF files.
    *   `@gltf-transform/extensions`: Extensions for `@gltf-transform/core`, such as Draco and KTX2 support.
    *   `@gltf-transform/functions`: Utility functions for glTF optimization.
    *   `draco3dgltf`: Draco compression and decompression library.
    *   `meshoptimizer`: Mesh optimization library for reordering and simplifying meshes.
*   **Styling:**
    *   `tailwindcss`: A utility-first CSS framework.
    *   `postcss`: A tool for transforming CSS with JavaScript.
    *   `autoprefixer`: PostCSS plugin to add vendor prefixes.
*   **Other:**
    *   `sharp`: High-performance image processing library.
    *   `tmp`: Temporary file and directory creator.
    *   `micromatch`: Glob matching library.

### Code Breakdown

#### Main Process (`packages/main`)

*   `index.ts`: This is the entry point for the Electron main process. It handles the creation of the main application window, manages the application lifecycle, and sets up inter-process communication (IPC) with the renderer process. It also initializes `electron-store` for storing user preferences and `electron-updater` for auto-updating.
*   The main process communicates with a web worker to execute long-running tasks like glTF packing without blocking the main thread.

#### Pack Worker (`packages/pack-worker`)

*   `index.ts`: This is the entry point for the web worker. It receives messages from the main process, performs the glTF packing operations using `@gltf-transform`, and sends back results or progress updates.
*   `utils.ts`: Contains utility functions for the worker, such as spawning the `toktx` process for texture compression and reporting size changes during different optimization steps.
*   `Logger.ts`: Provides a simple logging mechanism for the worker.
*   `constants.ts`: Defines constants and default values for texture compression settings.

#### Renderer Process (`packages/renderer`)

*   `App.vue`: The root Vue component that contains the main layout, including the title bar, model viewer, options panel, and log viewer.
*   `components/`: Contains reusable Vue components:
    *   `BabylonScene.vue`: Handles the rendering of the 3D model using Babylon.js. It loads the model, sets up the scene, camera, and lighting, and handles user interaction.
    *   `DropFileInput.vue`: Implements the drag-and-drop area for loading models.
    *   `ErrorMessage.vue`: Displays error messages to the user.
    *   `FileInfo.vue`: Shows information about the loaded model (name and file size).
    *   `InputGroup.vue`: A wrapper for form inputs, providing a consistent layout.
    *   `Log.vue`: Displays a log of actions and events.
    *   `PackButton.vue`: The button that triggers the packing process.
    *   `TitleBar.vue`: The application title bar with close and minimize buttons.
    *   `Inputs/`: Contains custom input components (Checkbox, Number, Radio, Select).
    *   `Tabs/`: Contains components for the tabbed options panel.
*   `main.ts`: The entry point for the Vue application. It creates the Vue app instance and mounts it to the DOM.
*   `utils.ts`: Contains utility functions used in the renderer process.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/notmike101/pack3d).

## License

Pack3D is released under the [MIT License](https://opensource.org/licenses/MIT).

## Credits

Pack3D is developed by Mike Orozco ([@notmike101](https://github.com/notmike101)).

This project utilizes the following libraries and technologies:

*   [Electron](https://www.electronjs.org/)
*   [Vue 3](https://vuejs.org/)
*   [Vite](https://vitejs.dev/)
*   [Babylon.js](https://www.babylonjs.com/)
*   [@gltf-transform](https://gltf-transform.donmccurdy.com/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   And many others listed in `package.json`

## Contact

For any questions or inquiries, please contact me at [me@mikeorozco.dev](mailto:me@mikeorozco.dev).

**Thank you for using Pack3D!**
