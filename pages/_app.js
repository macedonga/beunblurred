import "@/styles/globals.css";

import App from "next/app";
import Script from "next/script";
import { DefaultSeo } from "next-seo";
import Router, { useRouter } from "next/router";

import NProgress from "nprogress";
import "../styles/nprogress.css";

import Layout from "@/components/Layout";
import axios from "axios";
import { getCookie, hasCookie, setCookie } from "cookies-next";

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function Root({ Component, pageProps, userData }) {
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
    "tokenExpiration"
  ];
  const data = [];
  const cookieOptions = {
    req: appContext.ctx.req,
    res: appContext.ctx.res
  };
  let userData;

  if (requiredCookies.map(n => hasCookie(n, cookieOptions)).includes(false)) {
    userData = { notLoggedIn: true };
  } else {
    requiredCookies.forEach(n => data[n] = getCookie(n, cookieOptions));

    try {
      const reqOptions = { "headers": { "Authorization": `Bearer ${data.token}`, } };
      const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);
      userData = userResponse.data;
    } catch (e) {
      console.log(e);
      // deepcode ignore HardcodedNonCryptoSecret
      const refreshData = await axios.post(
        "https://auth.bereal.team/token?grant_type=refresh_token",
        {
          "grant_type": "refresh_token",
          "client_id": "ios",
          "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
          "refresh_token": data.refreshToken
        },
        {
          headers: {
            "Accept": "*/*",
            "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
            "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
            "Content-Type": "application/json"
          }
        }
      );

      const setCookieOptions = {
        req: appContext.ctx.req,
        res: appContext.ctx.res,
        maxAge: 60 * 60 * 24 * 7 * 3600,
        path: "/",
      };

      setCookie("token", refreshData.data.access_token, setCookieOptions);
      setCookie("refreshToken", refreshData.data.refresh_token, setCookieOptions);
      setCookie("tokenExpiration", Date.now() + (refreshData.data.expires_in * 1000), setCookieOptions);

      data.token = refreshData.data.access_token;
      data.refreshToken = refreshData.data.refresh_token;
    }

    const reqOptions = { "headers": { "Authorization": `Bearer ${data.token}`, } };
    const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);
    userData = userResponse.data;
  }

  return {
    ...appProps,
    userData,
  };
};

export default Root;