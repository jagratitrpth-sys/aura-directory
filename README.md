
# MediCare Aurora: Touchless Healthcare Kiosk
MediCare Aurora Interface

<img width="1903" height="953" alt="image" src="https://github.com/user-attachments/assets/494c0992-96bc-418a-819b-d7b64c5ddd5a" />




The MediCare Aurora kiosk interface is deployed and available to test here:

**[View Live Application]https://aura-directory.vercel.app/**
## 📌 Overview
MediCare Aurora is a multimodal, zero-contact digital kiosk interface designed for public healthcare spaces. Traditional digital kiosks in hospitals, pharmacies, and clinics rely on touchscreens, which can become a major source of transmission. 

Built as a post-COVID design solution, this interactive self-service device allows patients to access vital health information, check medicine availability, and complete check-ins entirely through hand gestures and voice commands, reducing physical contact and improving hygiene.

## ✨ Key Features
* **Zero-Contact Navigation:** Navigate the entire kiosk using simple hand gestures and voice commands.
* **Dwell-to-Select Mechanism:** Replaces physical tapping with a time-based dwell method. Holding the virtual hand cursor steady for 2 seconds triggers a "click" with visual progress feedback, preventing accidental selections.
* **Context-Aware Voice Routing:** Parses natural language to route users automatically:
  * *"Cardiology"* -> Department Directory
  * *"Register"* -> Check-in flow
  * *"Paracetamol"* -> Pharmacy Inventory search
* **State Recovery & Error Prevention:** Temporarily saves check-in data locally. If a session times out, returning users bypass repetitive data entry and pick up right where they left off.

## 🛠️ Architecture & Tech Stack
The project divides labor efficiently across a two-person development team, separating client-side sensor logic from backend data management.

**Frontend:**
* **UI & Layouts:** Rapid layout generation and component management utilizing Lovable.
* **Sensors:** Browser-native APIs (Web Speech API) and lightweight client-side skin-tone heuristic algorithms for instant hand tracking, avoiding server-side latency.

**Backend:**
* **Framework:** Robust Python-based backend utilizing Django and Django REST Framework (DRF) to handle data routing, API endpoints, and healthcare inventory logic. 

## 🎨 HCI & Design Principles
To build user trust and lower cognitive load, the interface prioritizes approachability and high visibility of system status:
* **The "Aurora" Aesthetic:** Replaces cold, sterile medical screens with a warm cream background, mint/lavender/coral aurora gradients, and deep ink-navy typography for high WCAG contrast.
* **Streamlined Typography:** A single-font approach using large, bold headings for readability from 2–3 feet away, with standard clean text for actions.
* **System Status Visibility:** A pulsing microphone icon, live-streaming text transcripts, and a virtual mint-colored hand cursor provide immediate visual feedback that the system is actively tracking user input.

## 🧪 Evaluation: Wizard of Oz Testing
Prior to finalizing the production-grade gesture tracking algorithms, the core user flow is evaluated using the **Wizard of Oz** HCI testing technique. 
* **Method:** Camera tracking is secretly disabled while a developer in an adjacent room manually triggers UI changes in response to the user's physical gestures and voice.
* **Goal:** Validates whether the 2-second dwell time feels natural and ensures visual cues are universally understood before committing to extensive backend integration.

## 🚀 Getting Started
*(Add your specific installation commands here depending on your repository structure)*

```bash
# Clone the repository
git clone [https://github.com/yourusername/medicare-aurora.git](https://github.com/yourusername/medicare-aurora.git)

# Setup Backend (Django)
cd backend
pip install -r requirements.txt
python manage.py runserver

# Setup Frontend
cd frontend
npm install
npm run dev
