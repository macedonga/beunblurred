import "@/styles/globals.css";

import { useEffect, useState } from "react";
import App from "next/app";
import Script from "next/script";
import { DefaultSeo } from "next-seo";
import Router, { useRouter } from "next/router";

import NProgress from "nprogress";
import "../styles/nprogress.css";

import Layout from "@/components/Layout";

import axios from "axios";
import { deleteCookie, getCookie, hasCookie, setCookie } from "cookies-next";
import cookieCutter from "cookie-cutter";

import {
  TolgeeProvider,
  DevTools,
  Tolgee,
  FormatSimple,
  useTolgeeSSR,
  BackendFetch
} from "@tolgee/react";
import { FormatIcu } from "@tolgee/format-icu";

import Loading from "@/components/Loading";

const tolgee = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .use(FormatIcu())
  .use(BackendFetch())
  .init({
    defaultLanguage: "en",
    apiKey: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
    apiUrl: process.env.NEXT_PUBLIC_TOLGEE_API_URL,
  });

function Root({ Component, pageProps }) {
  const router = useRouter();
  const [userData, setUserData] = useState({
    locale: router.locale,
    loading: true
  })
  const ssrTolgee = useTolgeeSSR(tolgee, router.locale);

  Router.events.on("routeChangeStart", () => {
    NProgress.start();
    setUserData(o => ({ ...o, loading: true }));
  });
  Router.events.on("routeChangeComplete", () => {
    NProgress.done();
    setUserData(o => ({ ...o, loading: false }));
  });
  Router.events.on("routeChangeError", () => {
    NProgress.done();
    setUserData(o => ({ ...o, loading: false }));
  });

  useEffect(() => {
    // Detect the browser's preferred language
    const browserLang = navigator.language || navigator.userLanguage;
    const supportedLocales = ["en", "it", "de", "es", "fr", "nl", "pl", "he", "jp"];
    const preferredLanguage = getCookie("preferredLanguage");
    let detectedLocale = "en"; // fallback to "en" if the browser's language is not supported

    if (preferredLanguage) {
      if (supportedLocales.includes(preferredLanguage)) {
        detectedLocale = preferredLanguage;
      }
    } else {
      if (supportedLocales.includes(browserLang)) {
        detectedLocale = browserLang;
      }
    }

    if (router.locale !== detectedLocale) {
      setUserData(o => ({ ...o, locale: detectedLocale }));
      // get actual url 
      router.push(router.asPath, router.asPath, { locale: detectedLocale });
    }
  }, [router.pathname]);

  useEffect(() => {
    const requiredCookies = [
      "token",
      "refreshToken",
      "tokenType",
      "user"
    ];
    const data = {};
    let ud;

    for (let c of requiredCookies) {
      data[c] = cookieCutter.get(c);
    }

    if (!data["token"] || !data["refreshToken"]) {
      ud = { notLoggedIn: true };
    } else {
      if (!data["user"]) {
        ud = { notLoggedIn: true };
      } else {
        try {
          ud = JSON.parse(data["user"]);
        } catch {
          ud = { notLoggedIn: true };
        }
      }
    }

    setUserData(o => ({
      ...o,
      ...ud,
      loading: false
    }));

    console.log(`                    :--:                    \n                .:=++++++=-.                \n             :-=+++++=-++++++-:             \n         .:=+++++=-.    .-=+++++=-.         \n      .-=++++=-:            :-++++++-:      \n  .:=+++++=-.                  .-=+++++=:.  \n.=+++++-:.                         :=++++++.\n.+++=.      .                  .      .=+++:\n:+++-    :-+++:              :+++=:    =+++:\n:+++-    +++++++:          :+++++++    =+++:\n:+++-    +++++++++:      :+++++++++    =+++:\n:+++-    ++++.-+++++:  :+++++-:++++    =+++:\n:+++-    ++++   -++++++++++-.  ++++    =+++:\n:+++-    ++++     -++++++-     ++++::=+++++:\n:+++-    ++++       :++-       +++++++++=:. \n:+=:     ++++                  ++++++-:     \n       .-++++                  ++=:.      :.\n    :-++++++=                  .      .-+**:\n :=++++++=.                        :=+++**+:\n  .-=+++++=-.                  .-=++++*+-.  \n     .:=++++++-:            :-++++++=-.     \n         .-=+++++=:.    .:=++++++-:         \n             :=++++++--++++++=:.            \n                .-++++++++-:                \n                  .:==-.\n\nBeUnblurred ${"https://www." + ("beun" + "bl" + String.fromCharCode(85).toLowerCase() + "rred") + ".co"}\nBy Marco Ceccon (https://marco.win)`);
  }, [router.pathname]);

  return (<>
    <TolgeeProvider tolgee={ssrTolgee} options={{ useSuspense: false }}>
      <Loading
        show={userData.loading}
      />

      <span id="username-ga" style={{display: "none"}}>{userData.username}</span>

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
        />

        <Component {...pageProps} locale={userData?.locale || "en"} />
      </Layout>
    </TolgeeProvider>
  </>);
}

export default Root;