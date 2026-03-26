import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useLoaderData, useNavigation, Link } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect } from "react";
import fs from "fs/promises";
import path from "path";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary$1 = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary: ErrorBoundary$1,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const ErrorPage = UNSAFE_withComponentProps(function ErrorPage2() {
  const message = "An unexpected error occurred.";
  return /* @__PURE__ */ jsxs("div", {
    className: "page-container",
    children: [/* @__PURE__ */ jsx("h2", {
      children: "Oops!"
    }), /* @__PURE__ */ jsx("p", {
      children: message
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ErrorPage
}, Symbol.toStringTag, { value: "Module" }));
const POSTS_DIR = path.resolve(process.cwd(), "posts");
function slugToTitle(slug) {
  return slug.replace(/^\d{4}-\d{2}-\d{2}-/, "").split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function slugToDate(slug) {
  return slug.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
}
async function getPost(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.html`);
  let html;
  try {
    html = await fs.readFile(filePath, "utf-8");
  } catch {
    throw new Response(null, { status: 404 });
  }
  return {
    slug,
    title: slugToTitle(slug),
    date: slugToDate(slug),
    html
  };
}
async function getAllPosts() {
  let files;
  try {
    files = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const posts = files.filter((f) => f.endsWith(".html")).map((f) => {
    const slug = f.replace(/\.html$/, "");
    return {
      slug,
      title: slugToTitle(slug),
      date: slugToDate(slug)
    };
  });
  return posts.sort(
    (a, b) => (b.date ?? "0000-00-00").localeCompare(a.date ?? "0000-00-00")
  );
}
async function loader$2() {
  const posts = await getAllPosts();
  const items = [{
    id: "cv-main",
    title: "Full CV – Andrew Hou",
    slug: "cv",
    category: "cv",
    favorite: true
  }, ...posts.map((p) => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
    category: "blog"
  }))];
  return {
    items
  };
}
const SunIcon = () => /* @__PURE__ */ jsxs("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  children: [/* @__PURE__ */ jsx("circle", {
    cx: "12",
    cy: "12",
    r: "5"
  }), /* @__PURE__ */ jsx("line", {
    x1: "12",
    y1: "1",
    x2: "12",
    y2: "3"
  }), /* @__PURE__ */ jsx("line", {
    x1: "12",
    y1: "21",
    x2: "12",
    y2: "23"
  }), /* @__PURE__ */ jsx("line", {
    x1: "4.22",
    y1: "4.22",
    x2: "5.64",
    y2: "5.64"
  }), /* @__PURE__ */ jsx("line", {
    x1: "18.36",
    y1: "18.36",
    x2: "19.78",
    y2: "19.78"
  }), /* @__PURE__ */ jsx("line", {
    x1: "1",
    y1: "12",
    x2: "3",
    y2: "12"
  }), /* @__PURE__ */ jsx("line", {
    x1: "21",
    y1: "12",
    x2: "23",
    y2: "12"
  }), /* @__PURE__ */ jsx("line", {
    x1: "4.22",
    y1: "19.78",
    x2: "5.64",
    y2: "18.36"
  }), /* @__PURE__ */ jsx("line", {
    x1: "18.36",
    y1: "5.64",
    x2: "19.78",
    y2: "4.22"
  })]
});
const MoonIcon = () => /* @__PURE__ */ jsx("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  children: /* @__PURE__ */ jsx("path", {
    d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
  })
});
const EmailIcon = () => /* @__PURE__ */ jsxs("svg", {
  className: "contact-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  children: [/* @__PURE__ */ jsx("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }), /* @__PURE__ */ jsx("polyline", {
    points: "22,6 12,13 2,6"
  })]
});
const LocationIcon = () => /* @__PURE__ */ jsxs("svg", {
  className: "contact-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  children: [/* @__PURE__ */ jsx("path", {
    d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
  }), /* @__PURE__ */ jsx("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })]
});
const GlobeIcon = () => /* @__PURE__ */ jsxs("svg", {
  className: "contact-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  children: [/* @__PURE__ */ jsx("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ jsx("line", {
    x1: "2",
    y1: "12",
    x2: "22",
    y2: "12"
  }), /* @__PURE__ */ jsx("path", {
    d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
  })]
});
const LinkedInIcon = () => /* @__PURE__ */ jsx("svg", {
  className: "contact-icon",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  children: /* @__PURE__ */ jsx("path", {
    d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
  })
});
const GitHubIcon = () => /* @__PURE__ */ jsx("svg", {
  className: "contact-icon",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  children: /* @__PURE__ */ jsx("path", {
    d: "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
  })
});
function ThemeToggle({
  darkMode,
  onToggle
}) {
  return /* @__PURE__ */ jsx("button", {
    onClick: onToggle,
    className: "theme-toggle",
    "aria-label": darkMode ? "Switch to light mode" : "Switch to dark mode",
    title: darkMode ? "Light mode" : "Dark mode",
    children: darkMode ? /* @__PURE__ */ jsx(SunIcon, {}) : /* @__PURE__ */ jsx(MoonIcon, {})
  });
}
function ContactBar() {
  return /* @__PURE__ */ jsxs("div", {
    className: "contact-grid",
    children: [/* @__PURE__ */ jsxs("a", {
      href: "mailto:andrew.weian.hou@gmail.com",
      className: "contact-item contact-link",
      children: [/* @__PURE__ */ jsx(EmailIcon, {}), /* @__PURE__ */ jsx("span", {
        children: "andrew.weian.hou@gmail.com"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "contact-item",
      children: [/* @__PURE__ */ jsx(LocationIcon, {}), /* @__PURE__ */ jsx("span", {
        children: "Ames, IA"
      })]
    }), /* @__PURE__ */ jsxs("a", {
      href: "https://sbbke.github.io/",
      className: "contact-item contact-link",
      target: "_blank",
      rel: "noopener noreferrer",
      children: [/* @__PURE__ */ jsx(GlobeIcon, {}), /* @__PURE__ */ jsx("span", {
        children: "sbbke.github.io"
      })]
    }), /* @__PURE__ */ jsxs("a", {
      href: "https://linkedin.com/in/andrew-hou-522423280",
      className: "contact-item contact-link",
      target: "_blank",
      rel: "noopener noreferrer",
      children: [/* @__PURE__ */ jsx(LinkedInIcon, {}), /* @__PURE__ */ jsx("span", {
        children: "Andrew Hou"
      })]
    }), /* @__PURE__ */ jsxs("a", {
      href: "https://github.com/Sbbke",
      className: "contact-item contact-link",
      target: "_blank",
      rel: "noopener noreferrer",
      children: [/* @__PURE__ */ jsx(GitHubIcon, {}), /* @__PURE__ */ jsx("span", {
        children: "@Sbbke"
      })]
    })]
  });
}
function SidebarSection({
  title,
  items,
  activePathPrefix
}) {
  const {
    pathname
  } = useNavigation().location ?? {};
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("h3", {
      className: "sidebar-section-title",
      children: title
    }), items.length > 0 ? /* @__PURE__ */ jsx("ul", {
      children: items.map((item) => {
        const to = item.category === "cv" ? `/cv${item.slug === "cv" ? "" : "/" + item.slug}` : `/blog/${item.slug}`;
        return /* @__PURE__ */ jsx("li", {
          children: /* @__PURE__ */ jsxs(Link, {
            to,
            className: pathname?.startsWith(activePathPrefix) ? "active" : "",
            children: [item.title, item.favorite && /* @__PURE__ */ jsx("span", {
              className: "favorite",
              children: "★"
            })]
          })
        }, item.id);
      })
    }) : /* @__PURE__ */ jsxs("p", {
      className: "sidebar-empty",
      children: ["No ", title.toLowerCase(), " yet"]
    })]
  });
}
function useDarkMode() {
  const [darkMode, setDarkMode] = useState(null);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      setDarkMode(saved === "dark");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);
  useEffect(() => {
    if (darkMode === null) return;
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const toggle = () => setDarkMode((prev) => !prev);
  return {
    darkMode,
    toggle
  };
}
const layout = UNSAFE_withComponentProps(function RootLayout() {
  const {
    items
  } = useLoaderData();
  const navigation = useNavigation();
  const {
    darkMode,
    toggle
  } = useDarkMode();
  const cvItems = items.filter((i) => i.category === "cv");
  const blogItems = items.filter((i) => i.category === "blog");
  const isLoading = navigation.state === "loading";
  return /* @__PURE__ */ jsxs("div", {
    className: "page-container",
    children: [/* @__PURE__ */ jsx("header", {
      className: "header",
      children: /* @__PURE__ */ jsxs("div", {
        className: "container",
        children: [/* @__PURE__ */ jsx(ThemeToggle, {
          darkMode,
          onToggle: toggle
        }), /* @__PURE__ */ jsx(Link, {
          to: "/",
          className: "page-title-link",
          children: /* @__PURE__ */ jsx("h1", {
            className: "page-title",
            children: "Andrew Hou"
          })
        }), /* @__PURE__ */ jsx(ContactBar, {})]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "app-layout",
      children: [/* @__PURE__ */ jsx("aside", {
        id: "sidebar",
        children: /* @__PURE__ */ jsxs("nav", {
          children: [/* @__PURE__ */ jsx(SidebarSection, {
            title: "CV",
            items: cvItems,
            activePathPrefix: "/cv"
          }), /* @__PURE__ */ jsx(SidebarSection, {
            title: "Blog Posts",
            items: blogItems,
            activePathPrefix: "/blog"
          })]
        })
      }), /* @__PURE__ */ jsx("main", {
        className: "main-content",
        children: /* @__PURE__ */ jsx("div", {
          className: "container",
          children: isLoading ? /* @__PURE__ */ jsxs("div", {
            className: "loading-placeholder",
            children: [/* @__PURE__ */ jsx("div", {
              className: "spinner"
            }), /* @__PURE__ */ jsx("p", {
              children: "Loading…"
            })]
          }) : /* @__PURE__ */ jsx(Outlet, {})
        })
      })]
    }), /* @__PURE__ */ jsxs("footer", {
      className: "footer",
      children: ["© ", (/* @__PURE__ */ new Date()).getFullYear(), " Andrew Hou"]
    })]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary3() {
  const {
    darkMode,
    toggle
  } = useDarkMode();
  return /* @__PURE__ */ jsx("div", {
    className: "app-layout",
    children: /* @__PURE__ */ jsx("main", {
      className: "main-content",
      children: /* @__PURE__ */ jsxs("div", {
        className: "container",
        children: [/* @__PURE__ */ jsx(ThemeToggle, {
          darkMode,
          onToggle: toggle
        }), /* @__PURE__ */ jsx(ErrorPage, {})]
      })
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: layout,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const logoDark = "/assets/logo-dark-pX2395Y0.svg";
const logoLight = "/assets/logo-light-CVbx2LBR.svg";
function Welcome() {
  return /* @__PURE__ */ jsx("main", { className: "flex items-center justify-center pt-16 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-16 min-h-0", children: [
    /* @__PURE__ */ jsx("header", { className: "flex flex-col items-center gap-9", children: /* @__PURE__ */ jsxs("div", { className: "w-[500px] max-w-[100vw] p-4", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: logoLight,
          alt: "React Router",
          className: "block w-full dark:hidden"
        }
      ),
      /* @__PURE__ */ jsx(
        "img",
        {
          src: logoDark,
          alt: "React Router",
          className: "hidden w-full dark:block"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-[300px] w-full space-y-6 px-4", children: /* @__PURE__ */ jsxs("nav", { className: "rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "leading-6 text-gray-700 dark:text-gray-200 text-center", children: "What's next?" }),
      /* @__PURE__ */ jsx("ul", { children: resources.map(({ href, text, icon }) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "a",
        {
          className: "group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500",
          href,
          target: "_blank",
          rel: "noreferrer",
          children: [
            icon,
            text
          ]
        }
      ) }, href)) })
    ] }) })
  ] }) });
}
const resources = [
  {
    href: "https://reactrouter.com/docs",
    text: "React Router Docs",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 20 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z",
            strokeWidth: "1.5",
            strokeLinecap: "round"
          }
        )
      }
    )
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 24 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M15.0686 1.25995L14.5477 1.17423L14.2913 1.63578C14.1754 1.84439 14.0545 2.08275 13.9422 2.31963C12.6461 2.16488 11.3406 2.16505 10.0445 2.32014C9.92822 2.08178 9.80478 1.84975 9.67412 1.62413L9.41449 1.17584L8.90333 1.25995C7.33547 1.51794 5.80717 1.99419 4.37748 2.66939L4.19 2.75793L4.07461 2.93019C1.23864 7.16437 0.46302 11.3053 0.838165 15.3924L0.868838 15.7266L1.13844 15.9264C2.81818 17.1714 4.68053 18.1233 6.68582 18.719L7.18892 18.8684L7.50166 18.4469C7.96179 17.8268 8.36504 17.1824 8.709 16.4944L8.71099 16.4904C10.8645 17.0471 13.128 17.0485 15.2821 16.4947C15.6261 17.1826 16.0293 17.8269 16.4892 18.4469L16.805 18.8725L17.3116 18.717C19.3056 18.105 21.1876 17.1751 22.8559 15.9238L23.1224 15.724L23.1528 15.3923C23.5873 10.6524 22.3579 6.53306 19.8947 2.90714L19.7759 2.73227L19.5833 2.64518C18.1437 1.99439 16.6386 1.51826 15.0686 1.25995ZM16.6074 10.7755L16.6074 10.7756C16.5934 11.6409 16.0212 12.1444 15.4783 12.1444C14.9297 12.1444 14.3493 11.6173 14.3493 10.7877C14.3493 9.94885 14.9378 9.41192 15.4783 9.41192C16.0471 9.41192 16.6209 9.93851 16.6074 10.7755ZM8.49373 12.1444C7.94513 12.1444 7.36471 11.6173 7.36471 10.7877C7.36471 9.94885 7.95323 9.41192 8.49373 9.41192C9.06038 9.41192 9.63892 9.93712 9.6417 10.7815C9.62517 11.6239 9.05462 12.1444 8.49373 12.1444Z",
            strokeWidth: "1.5"
          }
        )
      }
    )
  }
];
function meta({}) {
  return [{
    title: "New React Router App"
  }, {
    name: "description",
    content: "Welcome to React Router!"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  return /* @__PURE__ */ jsx(Welcome, {});
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1() {
  return {
    title: "Andrew Hou – Software Engineer CV",
    content: "Here is your full CV content...\nEducation...\nExperience...\nSkills..."
  };
}
const cv = UNSAFE_withComponentProps(function CvPost({
  loaderData
}) {
  const {
    title,
    content
  } = loaderData || {
    title: "CV",
    content: "Loading CV..."
  };
  return /* @__PURE__ */ jsx("div", {
    className: "cv-container",
    children: /* @__PURE__ */ jsxs("article", {
      className: "cv-article",
      children: [/* @__PURE__ */ jsxs("header", {
        className: "cv-header",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "cv-title",
          children: "Andrew Hou's CV"
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-contact-grid",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-contact-item",
            children: [/* @__PURE__ */ jsx("span", {
              className: "cv-contact-label",
              children: "Email:"
            }), /* @__PURE__ */ jsx("a", {
              href: "mailto:andrew.weian.hou@gmail.com",
              className: "cv-link",
              children: "andrew.weian.hou@gmail.com"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "cv-contact-item",
            children: [/* @__PURE__ */ jsx("span", {
              className: "cv-contact-label",
              children: "Location:"
            }), /* @__PURE__ */ jsx("span", {
              children: "Ames, IA"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "cv-contact-item",
            children: [/* @__PURE__ */ jsx("span", {
              className: "cv-contact-label",
              children: "Website:"
            }), /* @__PURE__ */ jsx("a", {
              href: "https://sbbke.github.io/",
              className: "cv-link",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "sbbke.github.io"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "cv-contact-item",
            children: [/* @__PURE__ */ jsx("span", {
              className: "cv-contact-label",
              children: "LinkedIn:"
            }), /* @__PURE__ */ jsx("a", {
              href: "https://linkedin.com/in/andrew-hou-522423280",
              className: "cv-link",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "andrew-hou-522423280"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "cv-contact-item",
            children: [/* @__PURE__ */ jsx("span", {
              className: "cv-contact-label",
              children: "GitHub:"
            }), /* @__PURE__ */ jsx("a", {
              href: "https://github.com/Sbbke",
              className: "cv-link",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "Sbbke"
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "cv-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "cv-section-title",
          children: "Education"
        }), /* @__PURE__ */ jsx("div", {
          className: "cv-entry",
          children: /* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Iowa State University"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Master in Computer Science"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Ames, Iowa"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Jan 2026 – present"
              })]
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "National Taichung University of Education"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Master in Computer Science"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Feb 2022 – June 2024"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Thesis: Exploring Security Strategies on Migration Approaches from Monolithic Systems to Microservices Architecture through Systematic Literature Review"
            }), /* @__PURE__ */ jsx("li", {
              children: "Advisor: Dr. Kuo-Hsun Hsu"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "National Taichung University of Education"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Bachelor in Computer Science"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "July 2017 – June 2021"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Capstone (team): Implementing Heterogeneous Container Technologies in Kubernetes"
            }), /* @__PURE__ */ jsx("li", {
              children: "Advisor: Dr. Kuan-Chou Lai"
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "cv-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "cv-section-title",
          children: "Experience"
        }), /* @__PURE__ */ jsx("div", {
          className: "cv-entry",
          children: /* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Hyvee"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Wine & Spirit crew member"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Ames, Iowa"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "July 2025 – present"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "7 months"
              })]
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Medicrowd Smart Healthcare"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "AI Software Engineer"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taipei, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Nov 2024 – Dec 2024"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "2 months"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Integrated Large Language Models (LLMs) into the customer service system, enhancing customer experience and reducing costs"
            }), /* @__PURE__ */ jsx("li", {
              children: "Implemented Retrieval-Augmented Generation (RAG) and Multi-agent Systems"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Department of Computer Science, NTCUE"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Graduate assistant"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Feb 2022 – Feb 2024"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "2 years 1 month"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Assisted in organizing the Collegiate Programming Examination (CPE) for 40+ participants"
            }), /* @__PURE__ */ jsx("li", {
              children: "Managed DHCP IP tables, NAT configurations, and firewall rules"
            }), /* @__PURE__ */ jsx("li", {
              children: "Maintained rack servers, blade servers, and network switches"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Software Engineering Lab, NTCUE"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Research Assistant"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Feb 2022 – June 2024"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "2 years 5 months"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Participated in research on applying design patterns through AOP (Aspect-Oriented Programming) for system refactoring"
            }), /* @__PURE__ */ jsx("li", {
              children: "Evaluated system improvements using the Goal-Question-Metric (GQM) approach"
            }), /* @__PURE__ */ jsx("li", {
              children: "Researched microservices architecture, focusing on monolith-to-microservices migration strategies and security mechanisms"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Department of Digital Content and Technology, NTCUE"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Research assistant"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Feb 2024 – June 2024"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "5 months"
              })]
            })]
          }), /* @__PURE__ */ jsx("ul", {
            className: "cv-list",
            children: /* @__PURE__ */ jsx("li", {
              children: "Applied AI-based pose recognition to sports performance analysis"
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Department of Computer Science, NTCUE"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Teaching assistant"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "Feb 2024 – June 2024"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "5 months"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Guided 30+ undergraduates in implementing CI/CD pipelines using Git, Maven, and Jenkins"
            }), /* @__PURE__ */ jsx("li", {
              children: "Evaluated coursework on low-level design (LLD) and software development life cycle (SDLC) methodologies"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "cv-entry-title",
                children: "Data Systems Consulting"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-subtitle",
                children: "Software Engineer Internship"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "cv-entry-meta",
              children: [/* @__PURE__ */ jsx("p", {
                children: "Taichung, TW"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-date",
                children: "July 2019 – Aug 2019"
              }), /* @__PURE__ */ jsx("p", {
                className: "cv-entry-duration",
                children: "2 months"
              })]
            })]
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Participated in the software development life cycle (SDLC)"
            }), /* @__PURE__ */ jsx("li", {
              children: "Analyzed user requirements through user stories"
            }), /* @__PURE__ */ jsx("li", {
              children: "Created product prototypes and designed onboarding pages"
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "cv-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "cv-section-title",
          children: "Projects"
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "cv-entry-title",
              children: "[team] STEM education NSTC 112-2410-H-142-027-MY3"
            }), /* @__PURE__ */ jsx("p", {
              className: "cv-entry-date",
              children: "June 2023 – Oct 2023"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-entry-description",
            children: "Interactive application aims to ease the data processing and llm fine-tuning"
          }), /* @__PURE__ */ jsx("ul", {
            className: "cv-list",
            children: /* @__PURE__ */ jsx("li", {
              children: "Designed software architecture and implemented a Python-based backend for data preprocessing and LLM model fine-tuning"
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "cv-entry-title",
              children: /* @__PURE__ */ jsx("a", {
                href: "https://github.com/Sbbke/phantom_mask",
                className: "cv-link",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "[personal] phantom_mask"
              })
            }), /* @__PURE__ */ jsx("p", {
              className: "cv-entry-date",
              children: "June 2025 – June 2025"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-entry-description",
            children: "A backend service for tracking pharmacies, masks, and user purchases using Golang, PostgreSQL, and Docker."
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Developed a Go-based backend for a pharmacy management system, implementing an ETL pipeline and containerized deployment"
            }), /* @__PURE__ */ jsx("li", {
              children: "Designed and implemented an ETL pipeline in Go to preprocess and load user and pharmacy data from JSON files into a PostgreSQL database"
            }), /* @__PURE__ */ jsx("li", {
              children: "Built a modular backend application using Cobra CLI, defining API endpoints, DTOs, and validation for pharmacy-related functionality, with middleware for error handling and recovery"
            }), /* @__PURE__ */ jsx("li", {
              children: "Configured a Dockerized environment with Docker Compose, optimizing image reuse across services for schema migrations, data preprocessing, and application runtime"
            }), /* @__PURE__ */ jsx("li", {
              children: "Developed unit and integration tests to validate ETL processes and API functionality, enhancing system reliability"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "cv-entry-header",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "cv-entry-title",
              children: /* @__PURE__ */ jsx("a", {
                href: "https://github.com/Sbbke/StableDiffusion-containerization",
                className: "cv-link",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "[personal] StableDiffusion-containerization"
              })
            }), /* @__PURE__ */ jsx("p", {
              className: "cv-entry-date",
              children: "June 2023 – present"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-entry-description",
            children: "Ongoing practice of containerize Stable-diffusion service"
          }), /* @__PURE__ */ jsxs("ul", {
            className: "cv-list",
            children: [/* @__PURE__ */ jsx("li", {
              children: "Configured a Dockerized environment with NVIDIA GPU support"
            }), /* @__PURE__ */ jsx("li", {
              children: "Used Python UV for dependency management"
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "cv-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "cv-section-title",
          children: "Publications"
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "cv-publication-title",
            children: "An AI-based posture recognition system for analyzing the impact of core muscle strength on the forehand loop against backspin in table tennis"
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-publication-date",
            children: "Oct 2025"
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-publication-authors",
            children: "Wu, C.-H., Chen, Y.-X., Hou, A. W., Chen, P.-Y., Chou, M.-T."
          }), /* @__PURE__ */ jsx("a", {
            href: "https://doi.org/10.1177/17479541251389701",
            className: "cv-publication-doi",
            target: "_blank",
            rel: "noopener noreferrer",
            children: "10.1177/17479541251389701"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "cv-publication-title",
            children: "Addressing security issues during decomposing golang monolithic applications into microservices through code analysis"
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-publication-date",
            children: "Apr 2024"
          }), /* @__PURE__ */ jsxs("p", {
            className: "cv-publication-authors",
            children: [/* @__PURE__ */ jsx("em", {
              children: "Hou, A. W."
            }), ", Hsu, K. H, Chen, Y. Y."]
          }), /* @__PURE__ */ jsx("a", {
            href: "https://doi.org/10.1109/ICASI60819.2024.10547752",
            className: "cv-publication-doi",
            target: "_blank",
            rel: "noopener noreferrer",
            children: "10.1109/ICASI60819.2024.10547752"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "cv-publication-title",
            children: "MAT: Automating Go monolithic applications transform into microservices through dependency analysis and AST"
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-publication-date",
            children: "Apr 2023"
          }), /* @__PURE__ */ jsxs("p", {
            className: "cv-publication-authors",
            children: [/* @__PURE__ */ jsx("em", {
              children: "Chen, Y. Y."
            }), ", Hsu, K. H., Hou, A. W"]
          }), /* @__PURE__ */ jsx("a", {
            href: "https://doi.org/10.1109/ICASI57738.2023.10179517",
            className: "cv-publication-doi",
            target: "_blank",
            rel: "noopener noreferrer",
            children: "10.1109/ICASI57738.2023.10179517"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "cv-entry",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "cv-publication-title",
            children: "The Evaluation of Aspect-Based Refactoring Method with Design Patterns Through GQM"
          }), /* @__PURE__ */ jsx("p", {
            className: "cv-publication-date",
            children: "Sept 2023"
          }), /* @__PURE__ */ jsxs("p", {
            className: "cv-publication-authors",
            children: ["Hsu, K. H., ", /* @__PURE__ */ jsx("em", {
              children: "Meng, Z. D."
            }), ", Hou, A. W"]
          }), /* @__PURE__ */ jsx("a", {
            href: "https://doi.org/10.6688/JISE.202309_39(5).0002",
            className: "cv-publication-doi",
            target: "_blank",
            rel: "noopener noreferrer",
            children: "10.6688/JISE.202309_39(5).0002"
          }), /* @__PURE__ */ jsx("span", {
            className: "cv-publication-journal",
            children: "(JISE 2023)"
          })]
        })]
      })]
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: cv,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
async function loader({
  params
}) {
  const post = await getPost(params.slug);
  return {
    post
  };
}
const $slug = UNSAFE_withComponentProps(function PostDetail() {
  const {
    post
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("article", {
    children: [/* @__PURE__ */ jsx("h1", {
      children: post.title
    }), post.date && /* @__PURE__ */ jsxs("p", {
      children: ["Published: ", new Date(post.date).toLocaleDateString()]
    }), /* @__PURE__ */ jsx("div", {
      dangerouslySetInnerHTML: {
        __html: post.html
      }
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $slug,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BlYjucd4.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BcLhSzEN.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": ["/assets/root-D6IbCcpi.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/layout": { "id": "routes/layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/layout-3Jipj7oZ.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js", "/assets/error-page-CiR8VqyR.js"], "css": ["/assets/layout-Da60n0NQ.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "routes/layout", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-DPRaz3S_.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/cv": { "id": "routes/cv", "parentId": "routes/layout", "path": "cv", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/cv-CrBirpgX.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": ["/assets/cv-yfr11vZP.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/cv/experience": { "id": "routes/cv/experience", "parentId": "routes/layout", "path": "cv/experience", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/experience-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog": { "id": "routes/blog", "parentId": "routes/layout", "path": "blog", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/blog-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/blog/$slug": { "id": "routes/blog/$slug", "parentId": "routes/layout", "path": "blog/:slug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_slug-IgI-YP8o.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/error-page": { "id": "routes/error-page", "parentId": "routes/layout", "path": "*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/error-page-CiR8VqyR.js", "imports": ["/assets/chunk-EPOLDU6W-B0KeTLaS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-759442b8.js", "version": "759442b8", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/layout": {
    id: "routes/layout",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home": {
    id: "routes/home",
    parentId: "routes/layout",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route2
  },
  "routes/cv": {
    id: "routes/cv",
    parentId: "routes/layout",
    path: "cv",
    index: true,
    caseSensitive: void 0,
    module: route3
  },
  "routes/cv/experience": {
    id: "routes/cv/experience",
    parentId: "routes/layout",
    path: "cv/experience",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/blog": {
    id: "routes/blog",
    parentId: "routes/layout",
    path: "blog",
    index: true,
    caseSensitive: void 0,
    module: route5
  },
  "routes/blog/$slug": {
    id: "routes/blog/$slug",
    parentId: "routes/layout",
    path: "blog/:slug",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/error-page": {
    id: "routes/error-page",
    parentId: "routes/layout",
    path: "*",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
