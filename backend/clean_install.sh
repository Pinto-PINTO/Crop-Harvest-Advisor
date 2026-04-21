#!/bin/bash
echo "🧹 Starting Modernized Clean Install..."

# 1. Activate Environment
source venv/bin/activate

# 2. Upgrade pip to avoid metadata errors
python3 -m pip install --upgrade pip

# 3. Force uninstall problematic old versions
pip uninstall tensorflow tensorflow-macos tensorflow-hub tensorflow-estimator tf-keras typing-extensions pydantic pydantic-core -y

# 4. Install the "Bridge" package first (with quotes for Zsh)
pip install "typing-extensions>=4.10.0"

# 5. Install the full requirements
pip install -r requirements.txt

echo "✅ Environment rebuilt successfully!"
echo "🔍 Verifying Critical Imports..."

python3 -c "import typing_extensions; import tensorflow; import tensorflow_hub; import fastapi; print('🚀 ALL SYSTEMS GO: Environment is compatible!')"