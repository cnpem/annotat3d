# Annotat3D - Developer & Contributor Guide

Welcome! This guide explains how the codebase is structured, how to contribute, development standards, and technical workflows.

If you only want to use Annotat3D:
👉 see `README.md`

---

## Repository Structure

The repository is organized into the following main directories:

### **Backend: `backend/sscAnnotat3D/`**
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

### **Public Assets: `public/assets/`**
Static assets used by the front-end application.

- **`icon/`**: Icons for various UI elements.

### **Specifications and Documentation: `spec/docs/`**
Resources related to specifications, scripts, and documentation.

- **`scripts/`**: Helper scripts for generating or processing documentation.
- **`styles/`**: Styles for documentation presentation.

### **Frontend Source: `src/`**
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

Thank you for contributing 🎉

