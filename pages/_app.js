import "@/styles/globals.css";
import Script from "next/script";
import { DefaultSeo } from "next-seo";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (<>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-BFT79HZ7RH" />
    <Script id="google-analytics">
      {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-BFT79HZ7RH');
        `}
    </Script>

    <Layout>
      <DefaultSeo
        titleTemplate="%s - BeUnblurred"
        defaultTitle="BeUnblurred"
        description="View your friends' BeReals without posting your own!"
        canonical="https://www.beunblurred.co"
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://www.beunblurred.co/",
          siteName: "BeUnblurred",
          description: "View your friends' BeReals without posting your own!"
        }}
        twitter={{
          handle: "@_macedonga_",
          site: "@_macedonga_",
          cardType: "summary_large_image",
        }}
      />

      <Component {...pageProps} />
    </Layout>
  </>);
}