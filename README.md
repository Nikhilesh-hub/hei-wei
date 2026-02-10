# Hei-wei — AI Biometrics

**Hei-wei** uses advanced AI to instantly estimate body metrics from a single photo.

Whether you upload an image or use your camera, our spatial AI analyzes 32 skeletal landmarks to calculate your height, weight, and body proportions in seconds.

## ✨ Features

-   **Instant Analysis:** Get results in seconds.
-   **High Accuracy:** Powered by Gemini 2.5 Flash.
-   **Privacy First:** All processing happens securely.
-   **Works Everywhere:** Mobile-friendly and responsive.

## 🚀 How to Use

1.  **Open the App.**
2.  **Choose:** "Capture Image" (Camera) or "Upload Photo".
3.  **Follow Guidelines:** Ensure full-body visibility and good lighting.
4.  **View Results:** See your estimated metrics instantly.

## 🛠️ For Developers

To run this project locally:

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/Nikhilesh-hub/hei-wei.git
    cd hei-wei
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your API credentials:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_GEMINI_MODEL=gemini-2.5-flash
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```

## 🔒 Security Note

This project uses `VITE_` prefixed environment variables to ensure compatibility with Vercel and secure deployment. Your API keys are never exposed in the source code.

---

*Powered by Google Gemini AI*
