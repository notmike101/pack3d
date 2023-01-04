export { }

declare global {
  interface Window {
    removeLoading: () => void,
  }

  __VITE_PACKAGE_VERSION__ = string;
}
