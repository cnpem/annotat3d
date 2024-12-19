# Annotat3D

## Description

**Annotat3D** is a modern web application designed for interactive segmentation of volumetric images, tailored to meet the needs of the imaging beamlines at [Sirius](https://lnls.cnpem.br/sirius-en/).

Annotat3D leverages human-in-the-loop strategies to facilitate the annotation of large tomographic datasets, enabling domain experts to inject their knowledge efficiently while collaborating with machine learning models. Here are the main features of Annotat3D:

- **High-Performance Image Segmentation**: Optimized for multi-GPU clusters, enabling efficient processing of large-scale datasets.
- **Intuitive Web Interface**: Provides tools for annotating, correcting, and managing labels in an accessible and user-friendly environment.
- **Real-Time Visualization**: Offers low-latency visualization of raw data, annotations, and predictions to ensure immediate feedback and streamlined workflows.
- **Advanced Filtering Tools**: A comprehensive suite of high-performance filters designed for HPC environments, enhancing image quality and reducing noise with exceptional speed and precision.
- **Active Contour Models**: Seamless automatic annotation and label correction powered by active contour models, improving efficiency and accuracy in label refinement.
- **HPC-Optimized Morphological Operations**: A robust suite of morphological operations, specifically implemented for HPC environments, to refine segmentation with precision and scalability.

## Project Status

Active development is ongoing with new features and optimizations planned for future releases.

#### Project Files

The repository is organized into the following main directories:

##### **Backend: `backend/sscAnnotat3D/`**
The back-end implementation handles high-performance computing and API services.

- **`api/`**: Defines API endpoints for communication between the front end and back end.
  - **`modules/`**: Modularized functionalities for API services.
- **`colormaps/`**: Colormap definitions for visualizing segmented data.
- **`cython/`**: High-performance modules implemented with Cython.
- **`help/`**: Help documentation and resources for the back-end.
- **`modules/`**: Core logic for segmentation and visualization tasks.
- **`repository/`**: Data access and storage utilities.
- **`static/`**: Static assets (e.g., images, JSON files) served by the back-end.
- **`templates/`**: HTML templates for server-side rendering.

##### **Public Assets: `public/assets/`**
Static assets used by the front-end application.

- **`icon/`**: Icons for various UI elements.

##### **Specifications and Documentation: `spec/docs/`**
Resources related to specifications, scripts, and documentation.

- **`scripts/`**: Helper scripts for generating or processing documentation.
- **`styles/`**: Styles for documentation presentation.

##### **Frontend Source: `src/`**
The front-end implementation using React and modern web technologies.

- **`components/`**: Reusable UI components.
  - **`canvas/`**: Handles rendering and interactions on the visualization canvas.
  - **`main_menu/`**: Components for the main menu interface.
    - **`file/`**: File management operations.
      - **`utils/`**: Utility functions for file handling.
  - **`tools_menu/`**: Tools for segmentation, annotation, and visualization.
    - **`annotation_menu/`**: Annotation-related tools and components.
      - **`label_table/`**: Displays and manages annotation labels.
      - **`label_tools/`**: Tools for label manipulation.
        - **`ThresholdComponents/`**: Threshold-based segmentation tools.
          - **`GlobalComponents/`**: Tools for global thresholding operations.
          - **`LocalComponents/`**: Tools for localized thresholding operations.
    - **`module_menu/`**: Advanced modules for segmentation and visualization.
    - **`utils/`**: Shared utilities for tools.
    - **`vis_menu/`**: Visualization settings and tools.
- **`pages/`**: Top-level components for application views and routing.
- **`public/`**: Public-facing assets for the front-end application.
- **`styles/`**: CSS and styling files.
- **`theme/`**: Configuration files for the application’s theme.
- **`utils/`**: Shared utility functions.

---

## Installation

The Annotat3D project can be built and deployed using either **Docker** or **Singularity**, ensuring flexibility for different environments. Follow the steps below based on your preferred containerization technology.

### Prerequisites
1. **Docker** or **Singularity** installed on your system:
   - [Install Docker](https://docs.docker.com/get-docker/)
   - [Install Singularity](https://sylabs.io/docs/)
2. Python 3 installed for generating container recipes.

### Building with Docker

To build and run Annotat3D using Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/annotat3d.git
   cd annotat3d
   ```

2. Generate the `Dockerfile` and build the Docker image:
   ```bash
   bash container/build_docker.sh
   ```

   This script will:
   - Generate a `Dockerfile` using an HPCCM recipe (`container/hpccm-cuda-gcc-openmpi-hdf-conda.py`).
   - Build the Docker image and tag it as `gitregistry.cnpem.br/gcd/data-science/segmentation/annotat3dweb`.

3. Run the Docker container:
   ```bash
   docker run -d -p 3000:3000 gitregistry.cnpem.br/gcd/data-science/segmentation/annotat3dweb
   ```

4. Access the web application at `http://localhost:3000`.

### Building with Singularity

To build and run Annotat3D using Singularity:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/annotat3d.git
   cd annotat3d
   ```

2. Generate the Singularity recipe and build the Singularity image:
   ```bash
   bash container/build_singularity.sh
   ```

   This script will:
   - Generate a Singularity definition file (`container/Singularity.def`) using the HPCCM recipe.
   - Build the Singularity image (`annotat3dweb.sif`).

3. Run the Singularity container:
   ```bash
   singularity exec annotat3dweb.sif ./start-server.sh
   ```

   Replace `./start-server.sh` with the appropriate script or command to start the Annotat3D service.

4. Access the web application at `http://localhost:3000`.

### Notes

- **HPCCM Recipe**: The `container/hpccm-cuda-gcc-openmpi-hdf-conda.py` script generates recipes for both Docker and Singularity containers, ensuring compatibility with HPC environments.
- Ensure you execute the build scripts from the project’s root directory to avoid path issues.
- If additional dependencies are required, update the HPCCM recipe file before building the image.

---

## Usage

### For Users
1. Load a volumetric dataset in `.h5` format via the GUI.
2. Annotate slices using the interactive tools.
3. Use machine learning-powered segmentation and preview results.

### For Developers
To set up a development environment:
```bash
python -m pip install -r requirements.txt
```

---

## Code Development Standards

### **General Guidelines**
1. **Version Control**:
   - Use meaningful commit messages that describe what the change accomplishes (e.g., `fix: resolve issue with API endpoint timeout` or `feat: add annotation preview feature`).
   - Adhere to Git workflows (e.g., feature branches for new development, pull requests with proper code reviews before merging).

2. **Code Documentation**:
   - Use clear and concise comments to explain complex logic.
   - Ensure that every function and class has a docstring explaining its purpose, inputs, and outputs (e.g., adhere to the Google or NumPy docstring format).

### **Python Standards**
1. **Imports**:
   - Use **relative imports** for internal modules within the same package.
   - Avoid **absolute imports**; instead, rely on what is exposed publicly via `__init__.py` files in a module.
   - Group imports in the following order:
     1. Standard library imports.
     2. Third-party library imports.
     3. Internal imports.
     Example:
     ```python
     import os
     import numpy as np
     from .utils import compute_gradients
     ```

2. **Module Structure**:
   - Organize related classes and functions into modules and sub-packages for clarity and reusability.
   - Classes, methods, and settings intended for external use must be explicitly **exposed in the `__init__.py`** file.
   - Name **private modules, functions, and variables** with a leading underscore (e.g., `_helper_function`, `_private_module`).

3. **Coding Style**:
   - Follow [PEP 8](https://peps.python.org/pep-0008/) for Python coding style.
   - Use **type hints** and annotations for all functions:
     ```python
     def calculate_area(radius: float) -> float:
         return 3.14 * radius ** 2
     ```
   - Limit line length to 79 characters (or 120 characters for comments and docstrings).

4. **Testing**:
   - Write unit tests for all major functions and modules using **pytest** or a similar framework.
   - Maintain a minimum test coverage of 80% or higher for new code.

5. **Error Handling**:
   - Always handle exceptions gracefully, and avoid generic exceptions like `except:`.
   - Log errors with context to facilitate debugging.

### **React Standards**
1. **Component Structure**:
   - Use **functional components** with React Hooks for new features unless class components are explicitly required.
   - Keep components small and focused, following the **single responsibility principle**.

2. **File Organization**:
   - Use a **feature-based folder structure**, grouping related components, hooks, styles, and utilities together.
     Example:
     ```
     src/
     ├── components/
     │   └── Button/
     │       ├── Button.jsx
     │       ├── Button.test.jsx
     │       ├── Button.module.css
     │       └── index.js
     ```

3. **State Management**:
   - Use **React Context** or a state management library like Redux or Zustand when the state needs to be shared across components.
   - Keep local state inside components if it does not need to be shared.

4. **Coding Style**:
   - Follow [ESLint](https://eslint.org/) with an Airbnb or similar style guide.
   - Use **Prettier** for consistent formatting.
   - Prefer destructuring for cleaner and more readable code:
     ```javascript
     const { name, age } = props;
     ```

5. **Testing**:
   - Write tests using **Jest** and **React Testing Library** to ensure components render and behave correctly.
   - Strive for comprehensive coverage, including edge cases.

6. **Error Handling**:
   - Use error boundaries to catch errors in React components.
   - Handle asynchronous errors with proper `try-catch` blocks.

### **Commit and Code Review Best Practices**
1. Use meaningful branch names, e.g., `feature/add-annotation-tool` or `bugfix/fix-docker-build`.
2. Squash commits into meaningful units before merging to the main branch.
3. Conduct code reviews to maintain code quality, focusing on:
   - Readability.
   - Adherence to standards.
   - Test coverage.

---

## Deployment

To deploy a new version:
1. Update the version number in `pyproject.toml`.
2. Build the package:
   ```bash
   python -m build
   ```
3. Upload to PyPI:
   ```bash
   twine upload dist/*
   ```

---

## Contributing

We welcome contributions of all kinds to improve and expand Annotat3D! Whether you're fixing a bug, adding a new feature, improving the documentation, or suggesting ideas, your contributions make a difference.

### **How to Contribute**

1. **Fork the Repository**
   - Click the **Fork** button at the top-right of the repository page to create your own copy.

2. **Clone Your Fork**
   - Clone the forked repository to your local machine:
     ```bash
     git clone https://github.com/your-username/annotat3d.git
     cd annotat3d
     ```

3. **Create a Branch**
   - Create a new branch for your changes:
     ```bash
     git checkout -b feature/your-feature-name
     ```

4. **Make Your Changes**
   - Follow the [Code Development Standards](#code-development-standards).
   - Ensure your changes are well-documented and include relevant test cases.

5. **Test Your Changes**
   - Run tests to verify your changes:
     ```bash
     pytest
     ```

6. **Commit and Push**
   - Commit your changes with a meaningful message:
     ```bash
     git commit -m "feat: add feature description"
     ```
   - Push your branch:
     ```bash
     git push origin feature/your-feature-name
     ```

7. **Open a Pull Request (PR)**
   - Go to the original repository, click **Pull Requests**, and submit a new PR.
   - Add a clear description of your changes and why they are needed.

8. **Engage in the Review Process**
   - Respond to feedback and suggestions during the review process. Your PR will be merged once approved.


### **Other Ways to Contribute**

Not a coder? No problem! You can still contribute in other ways:

- **Report Issues**:
  - Found a bug or have a feature request? Open an issue in the [Issues](https://github.com/cnpem/annotat3d/issues) tab.

- **Improve Documentation**:
  - Help us keep the documentation up-to-date by fixing typos, clarifying instructions, or expanding examples.

- **Participate in Discussions**:
  - Share ideas and provide feedback in the [Discussions](https://github.com/cnpem/annotat3d/discussions) tab.

- **Triage Issues**:
  - Help label and organize issues to make them easier for contributors to pick up.

---

### **Need Help?**

If you need help getting started or have any questions, feel free to:
- Open a discussion in the [Discussions](https://github.com/cnpem/annotat3d/discussions) tab.
- Reach out to the maintainers listed in the [Contributors](#contributors) section.

We look forward to your contributions! 🎉

---

## Contributors

- 👤 **Allan Pinto**
- 👤 **Egon Borges**
- 👤 **Ricardo Grangeiro**
- 👤 **Camila Machado de Araújo**

---

## Former Contributors

- [Alan Peixinho](https://www.linkedin.com/in/alan-zanoni-peixinho-2816ab23)
- [Allan Pinto](https://www.linkedin.com/in/allansp84/)
- [Bruno Carlos](https://www.linkedin.com/in/bruno-vasco-711345231/)
- [Eduardo X. Miqueles](https://lnls.cnpem.br/equipe/eduardo-xavier-silva-miqueles/)
- [Gabriel Borin](https://www.linkedin.com/in/gabriel-borin-3b7b7a14b)
- [Giovanna Antonieti](https://www.linkedin.com/in/giovannaantonieti)
- [Henrique Gonçalves](https://www.linkedin.com/in/henrique-machado-gon%C3%A7alves-2393548b)
- [Jhessica Silva](https://www.linkedin.com/in/jhessica)
- [Matheus Bernardi](https://www.linkedin.com/in/matheus-bernardi)
- [Matheus Sarmento](https://br.linkedin.com/in/f3rnnds/pt)
- [Paulo Mausbach](https://www.linkedin.com/in/paulo-baraldi-mausbach-094b9216a)
- [Thiago Spina](https://www.linkedin.com/in/thiago-vallin-spina-935563100)
- [Victor Cesaroni](https://www.linkedin.com/in/victorcesaroni)
- [Vitória Pinho](https://lnls.cnpem.br/)

---

## License

This project is licensed under the **GNU General Public License v3.0**.

### Summary of the License
- You are free to:
  - **Use**: Run the software for any purpose.
  - **Study**: Access and modify the source code.
  - **Share**: Distribute copies of the software.
  - **Contribute**: Distribute modified versions of the software.

- Requirements:
  - If you distribute copies or modified versions, you **must make the source code available** under the same license.
  - Any changes you make to the software must be clearly documented.
  - You **cannot add restrictions** that would deny other users the freedoms granted by this license.

For more details, see the full license text in the [`LICENSE`](./LICENSE) file or visit the [GNU GPL v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) page.

By using or modifying this software, you agree to the terms and conditions outlined in the license.
