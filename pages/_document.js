import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          id="hydro_config"
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              window.Hydro_tagId = "c91104f9-2853-42d3-9026-7af0f03b42d1";
            `,
          }}
        />
        <script id="hydro_script" src="https://track.hydro.online/"></script>

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
        <meta name="msapplication-TileColor" content="#0d0d0d" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="theme-color" content="#0d0d0d" />

        <meta name="twitter:card" content="app" />
        <meta name="twitter:app:name:googleplay" content="BeUnblurred" />
        <meta
          name="twitter:app:id:googleplay"
          content="co.beunblurred.macedonga"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
};
