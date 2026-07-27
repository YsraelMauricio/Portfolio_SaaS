/**
 * ThemeScript — inline script that runs before first paint to sync
 * the user's persisted theme preference with the <html> data-theme attribute.
 *
 * Without this, a client-side React effect would cause a flash of the
 * wrong theme (FOUC) before hydration completes.
 *
 * This is a client component by necessity (it renders a <script>), but
 * the script itself is pure vanilla JS that executes synchronously.
 */

export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'light' || theme === 'dark') {
                document.documentElement.setAttribute('data-theme', theme);
              } else {
                // No stored preference — check system preference
                var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                document.documentElement.setAttribute('data-theme', prefersLight ? 'light' : 'dark');
              }
            } catch(e) {
              // localStorage unavailable — default dark
              document.documentElement.setAttribute('data-theme', 'dark');
            }
          })();
        `,
      }}
    />
  );
}
