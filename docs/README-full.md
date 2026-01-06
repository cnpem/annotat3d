# Annotat3D

## Overview

**Annotat3D** is a modern web application designed for interactive segmentation of volumetric images, tailored to meet the needs of the imaging beamlines at [Sirius](https://lnls.cnpem.br/sirius-en/).

![alt text](docs/public/assets/screenshots/page-home.png "Annotat3D")

---

## ✨ Key Features

Annotat3D leverages human-in-the-loop strategies to facilitate the annotation of large tomographic datasets, enabling domain experts to inject their knowledge efficiently while collaborating with machine learning models. Here are the main features of Annotat3D:

- **High-Performance Image Segmentation**: Optimized for multi-GPU clusters, enabling efficient processing of large-scale datasets.
- **Intuitive Web Interface**: Provides tools for annotating, correcting, and managing labels in an accessible and user-friendly environment.
- **Real-Time Visualization**: Offers low-latency visualization of raw data, annotations, and predictions to ensure immediate feedback and streamlined workflows.
- **Advanced Filtering Tools**: A comprehensive suite of high-performance filters designed for HPC environments, enhancing image quality and reducing noise with exceptional speed and precision.
- **Active Contour Models**: Seamless automatic annotation and label correction powered by active contour models, improving efficiency and accuracy in label refinement.
- **HPC-Optimized Morphological Operations**: A robust suite of morphological operations, specifically implemented for HPC environments, to refine segmentation with precision and scalability.

---

## Project Status

Actively developed with new features and performance improvements planned.

---

# Quick Start

Annotat3D supports both desktop use and HPC environments.

---

## ✅ Option 1: Run Pre-Built Docker Image (Recommended)

```bash
docker pull docker.io/allansp84/annotat3d-prod:latest
docker run -d -p 8000:8000 annotat3dweb-prod:latest
```

Access at:

```
http://localhost:8000
```

---

## 🛠️ Option 2: Build Docker

```bash
git clone https://github.com/cnpem/annotat3d.git
cd annotat3d
bash container/build_docker.sh
docker run -d -p 8000:8000 annotat3dweb-prod:latest
```

---

## 🧬 Option 3: Build Singularity (HPC Friendly)

```bash
git clone https://github.com/cnpem/annotat3d.git
cd annotat3d
bash container/build_singularity.sh base
bash container/build_singularity.sh production
singularity run --nv annotat3d-prod.sif
```

Access:

```
http://localhost:8000
```

---

# 📘 Documentation

### Run Docs from Container

```bash
docker pull allansp84/annotat3d-documentation:latest
docker run --rm -it -p 3000:3000 \
    -e PORT=3000 \
    -e HOST=0.0.0.0 \
    -e CI=true \
    allansp84/annotat3d-documentation:latest
```

or build locally:

```bash
cd docs
docker compose up -d --build
```

Docs available at:

```
http://localhost:3000
```

---

# 🎯 Usage

### Users

1. Load a volumetric dataset in `.h5` format via the GUI.
2. Annotate slices using the interactive tools.
3. Use machine learning-powered segmentation and preview results.
4. Export results

---

# 🤝 Contributing

Contributions are welcome!
See the **Developer Guide**:

👉 `docs/DEVELOPER.md`

---

# 👥 Contributors

* Allan Pinto
* Camila Machado de Araújo
* Egon Borges
* Ricardo Grangeiro

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


---

If you need help, please open an Issue or Discussion.
Enjoy Annotat3D!

---

# ✅ 2️⃣ DEVELOPER GUIDE (Technical & Contributors)

👉 Save as: **`docs/DEVELOPER.md`**

---

# Annotat3D -- Developer & Contributor Guide

Welcome! This guide explains how the codebase is structured, how to contribute, development standards, and technical workflows.

If you only want to use Annotat3D:
👉 see `README.md`

---

# Repository Structure

## Backend -- `backend/sscAnnotat3D/`

HPC backend + REST API

* `api/`
* `modules/`
* `cython/`
* `repository/`
* `templates/`
* `static/`
* `help/`
* `colormaps/`

---

## Frontend -- `src/`

React + modern web stack

* `components/`
* `tools_menu/`
* `annotation_menu/`
* `module_menu/`
* `vis_menu/`
* `pages/`
* `theme/`
* `utils/`
* `styles/`
* `public/`

---

## Other Important Directories

* `public/assets/`
* `spec/docs/`

---

# 🧑‍💻 Developer Setup

```bash
python -m pip install -r requirements.txt
```

---

# 🐳 Containers for Development

### Docker Build

```bash
bash container/build_docker.sh
```

### Singularity Build

```bash
bash container/build_singularity.sh base
bash container/build_singularity.sh production
```

---

# 🧾 Documentation System

Supports:

* prebuilt container docs
* local mkdocs/docker compose docs

Full commands preserved in project docs.

---

# 🧑‍⚖️ Coding Standards

## General

* meaningful commits
* feature branches
* code review before merge

---

## Python

* PEP8
* type hints encouraged
* relative imports
* exception hygiene
* structured logging
* ≥ 80% test coverage

---

## React

* functional components
* hooks
* feature-based structure
* ESLint + Prettier mandatory
* Jest + RTL tests

---

# 🧪 Testing

Backend: `pytest`
Frontend: `jest`, `react-testing-library`

---

# 🚀 Release / PyPI

* update version
* build
* upload with twine

---

# 🧭 Contribution Workflow

1️⃣ Fork
2️⃣ Create branch
3️⃣ Implement
4️⃣ Test
5️⃣ Submit PR
6️⃣ Participate in Review

---

# 📜 Contributors

Full contributor + former contributor list maintained historically.

---

# 🛡 License

GNU GPL v3.0

---

Thank you for contributing 🎉

---

# ✅ 3️⃣ CNPEM INTERNAL DOCUMENT

👉 Save as: **`docs/CNPEM-INTERNAL.md`**

---

# Annotat3D -- CNPEM Internal Technical & Governance Document

## Institutional Context

Annotat3D is developed within **CNPEM / LNLS / Sirius**, supporting high-impact scientific workflows related to imaging beamlines, tomography pipelines, and FAIR-aligned data lifecycle management initiatives.

It is part of strategic efforts to:

* improve data usability
* enable reproducible segmentation workflows
* support advanced scientific imaging
* integrate human expertise + AI
* align with institutional **FAIR Data**, **HPC**, and **Scientific Software** strategies

---

## Target Users

* LNLS beamline scientists
* CNPEM researchers
* invited collaborators
* HPC operators
* software & data engineering teams

---

## Supported Environments

* LNLS HPC clusters
* GPU-enabled workstations
* containerized deployments
* controlled network environments
* restricted compute environments (Singularity)

---

## Governance & Responsibilities

### Development Leadership

* Core Maintainers: CNPEM team
* Code Review Process enforced
* Institutional approval required for:

  * architecture changes
  * security-sensitive changes
  * licensing changes
  * public release milestones

---

## Security & Compliance

* GPLv3 license compliance
* internal dependency policy
* approved container runtimes
* secure credential handling
* compliance with CNPEM IT rules

---

## Deployment Strategy

Production deployments should:

* use approved container registries
* follow CNPEM internal DevOps rules
* avoid unauthorized image mirrors
* use controlled runtime environments

---

## HPC Notes

* GPU execution encouraged
* Singularity strongly recommended on clusters
* proper resource scheduling required
* must respect cluster policies

---

## Documentation Responsibility

* Public documentation: Developer Team
* Internal technical practices: CNPEM stakeholders
* Knowledge transfer encouraged

---

## Institutional Acknowledgment

If used in scientific publications:

* Acknowledge LNLS / CNPEM
* Reference Sirius where appropriate
* Cite associated papers when applicable

---

## Long-Term Vision

Annotat3D contributes to:

* sustainable scientific software
* advanced imaging processing capabilities
* institutional digital transformation

---

## Contacts

Internal CNPEM communication channels should be used for:

* support
* roadmap discussion
* governance decisions
* secure discussions

---

## Final Notes

This document complements:

* `README.md`
* `docs/DEVELOPER.md`

It reflects internal expectations, governance mindset, and institutional maturity.

---

# 🎯 Done

You now have:

✅ Clean user README
✅ Full professional developer guide
✅ CNPEM-aligned institutional documentation

If you want next:

* Portuguese versions
* MkDocs auto-structured docs
* CI/CD publishing to Pages
* versioning strategy
* governance diagram

Just tell me 😊
