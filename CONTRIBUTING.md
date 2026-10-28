# Contributing to OpenProcure

Thank you for your interest in contributing to OpenProcure!

## Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone.

## Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/0xyz-exe/openprocure.git
   cd openprocure
   ```

2. Backend Setup:
   ```bash
   cd apps/api
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python seed.py
   uvicorn app.main:app --reload --port 8000
   ```

3. Frontend Setup:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

## Running Tests
Run the automated test suite before opening a pull request:
```bash
cd apps/api
pytest
```
