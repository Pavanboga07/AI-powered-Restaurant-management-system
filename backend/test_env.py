"""Quick test to check if .env is loading correctly"""
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / '.env'
print(f"Loading from: {env_path}")
print(f"File exists: {env_path.exists()}")

# Force reload
load_dotenv(dotenv_path=env_path, override=True)

mail_username = os.getenv("MAIL_USERNAME")
mail_password = os.getenv("MAIL_PASSWORD")

print(f"\nMAIL_USERNAME: {mail_username}")
print(f"MAIL_PASSWORD: {mail_password[:4]}...{mail_password[-4:] if mail_password else 'None'}")

if mail_username == "pavanboga07@gmail.com":
    print("\n✅ Email credentials are correct!")
else:
    print(f"\n❌ Wrong email! Expected 'pavanboga07@gmail.com', got '{mail_username}'")
