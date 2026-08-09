import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%", width: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                width: 100%;
                height: 100%;
                min-height: 100vh;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                background-color: #0f172a;
                color: #f8fafc;
              }
            `,
          }}
        />
      </head>
      <body style={{ height: "100%", width: "100%", margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
