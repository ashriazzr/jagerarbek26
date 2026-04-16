
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Handle redirect from GitHub Pages 404.html
  const handleGitHubPagesRedirect = () => {
    const redirect = sessionStorage.redirect;
    if (redirect) {
      delete sessionStorage.redirect;
      // Replace current history state to avoid back button issues
      window.history.replaceState(null, "", redirect);
    }
  };

  handleGitHubPagesRedirect();

  createRoot(document.getElementById("root")!).render(<App />);
  