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
} from "@tolgee/react";
import { FormatIcu } from "@tolgee/format-icu";

import enLocale from "../i18n/en.json";
import itLocale from "../i18n/it.json";
import deLocale from "../i18n/de.json";
import esLocale from "../i18n/es.json";
import frLocale from "../i18n/fr.json";
import nlLocale from "../i18n/nl.json";
import plLocale from "../i18n/pl.json";
import Loading from "@/components/Loading";

const tolgee = Tolgee()
  .use(FormatIcu())
  .use(DevTools())
  .use(FormatSimple())
  .init({
    defaultLanguage: "en",
    apiKey: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
    apiUrl: process.env.NEXT_PUBLIC_TOLGEE_API_URL,
    staticData: {
      en: enLocale,
      it: itLocale,
      de: deLocale,
      es: esLocale,
      fr: frLocale,
      nl: nlLocale,
      pl: plLocale
    },
  });

function Root({ Component, pageProps }) {
  const router = useRouter();
  const [userData, setUserData] = useState({
    locale: router.locale || "en",
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

    setUserData({
      ...ud,
      locale: router.locale || "en",
      loading: false
    });

    console.log(`                    :--:                    \n                .:=++++++=-.                \n             :-=+++++=-++++++-:             \n         .:=+++++=-.    .-=+++++=-.         \n      .-=++++=-:            :-++++++-:      \n  .:=+++++=-.                  .-=+++++=:.  \n.=+++++-:.                         :=++++++.\n.+++=.      .                  .      .=+++:\n:+++-    :-+++:              :+++=:    =+++:\n:+++-    +++++++:          :+++++++    =+++:\n:+++-    +++++++++:      :+++++++++    =+++:\n:+++-    ++++.-+++++:  :+++++-:++++    =+++:\n:+++-    ++++   -++++++++++-.  ++++    =+++:\n:+++-    ++++     -++++++-     ++++::=+++++:\n:+++-    ++++       :++-       +++++++++=:. \n:+=:     ++++                  ++++++-:     \n       .-++++                  ++=:.      :.\n    :-++++++=                  .      .-+**:\n :=++++++=.                        :=+++**+:\n  .-=+++++=-.                  .-=++++*+-.  \n     .:=++++++-:            :-++++++=-.     \n         .-=+++++=:.    .:=++++++-:         \n             :=++++++--++++++=:.            \n                .-++++++++-:                \n                  .:==-.\n\nBeUnblurred ${"https://www." + ("beun" + "bl" + String.fromCharCode(85).toLowerCase() + "rred") + ".co"}\nBy Marco Ceccon (https://marco.win)`);
  }, []);

  return (<>
    <TolgeeProvider tolgee={ssrTolgee} options={{ useSuspense: false }}>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-BFT79HZ7RH" />
      <Script id="google-analytics">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-BFT79HZ7RH');
      `}
      </Script>

      <Loading
        show={userData.loading}
        // show={true}
      />

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