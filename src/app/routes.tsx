import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { LatenessForm } from "./components/LatenessForm";
import { AccumulationReports } from "./components/AccumulationReports";
import { ConfiscationForm } from "./components/ConfiscationForm";
import { StudentManagement } from "./components/StudentManagement";
import { GithubTutorial } from "./components/GithubTutorial";
import { NotFound } from "./components/NotFound";

// Get the base path for GitHub Pages
const getBasename = () => {
  // Check if running on GitHub Pages
  if (window.location.hostname === 'ashriazzr.github.io') {
    return '/jagerarbek26/';
  }
  return '/';
};

const routes = [
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "keterlambatan", Component: LatenessForm },
      { path: "akumulasi", Component: AccumulationReports },
      { path: "laporan", Component: AccumulationReports }, // backward compat redirect
      { path: "razia", Component: ConfiscationForm },
      { path: "siswa", Component: StudentManagement },
      { path: "tutorial", Component: GithubTutorial },
      { path: "*", Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  basename: getBasename(),
});
