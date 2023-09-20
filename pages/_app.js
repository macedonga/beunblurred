import "@/styles/globals.css";

import { useEffect } from "react";
import App from "next/app";
import Script from "next/script";
import { DefaultSeo } from "next-seo";
import Router, { useRouter } from "next/router";

import NProgress from "nprogress";
import "../styles/nprogress.css";

import Layout from "@/components/Layout";
import axios from "axios";
import { deleteCookie, getCookie, hasCookie, setCookie } from "cookies-next";

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function Root({ Component, pageProps, userData }) {
  useEffect(() => {
    console.log("Made by Marco Ceccon https://marco.win\nThe official website is https://beunblurred.co");
  }, []);

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

    <Layout user={userData || {}}>
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

Root.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);

  const requiredCookies = [
    "token",
    "refreshToken",
    "tokenType",
    "user"
  ];
  const data = [];
  const cookieOptions = {
    req: appContext.ctx.req,
    res: appContext.ctx.res
  };
  let userData;

  if (!hasCookie("token", cookieOptions) || !hasCookie("refreshToken", cookieOptions)) {
    userData = { notLoggedIn: true };
  } else {
    if (!hasCookie("user", cookieOptions)) {
      requiredCookies.map(c => deleteCookie(c, cookieOptions));

      userData = { notLoggedIn: true };
    } else {
      try {
        userData = JSON.parse(getCookie("user", cookieOptions));
      } catch {
        requiredCookies.map(c => deleteCookie(c, cookieOptions));

        userData = { notLoggedIn: true };
      }
    }
  }

  return {
    ...appProps,
    userData,
  };
};

export default Root;