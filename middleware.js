import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const LOCALES = ["en", "it", "de", "es", "fr", "nl", "pl"];

const getBrowserLanguage = (req) => {
    return req.headers
        .get("accept-language")
        ?.split(",")
        .map((i) => i.split(";"))
        ?.reduce(
            (ac, lang) => [
                ...ac,
                { code: lang[0], priority: lang[1] },
            ],
            []
        )
        ?.sort((a, b) => (a.priority > b.priority ? -1 : 1))
        ?.find((i) => LOCALES.includes(i.code.substring(0, 2)))
        ?.code?.substring(0, 2);
};

export async function middleware(req) {
    if (
        req.nextUrl.pathname.startsWith("/_next") ||
        req.nextUrl.pathname.includes("/api/") ||
        req.nextUrl.pathname.includes("/monitoring") ||
        PUBLIC_FILE.test(req.nextUrl.pathname)
    ) {
        return;
    }

    const browserLanguage = getBrowserLanguage(req);
    const urlLocale = req.nextUrl.locale;
    const preferredLanguage = req.cookies.get("preferredLanguage")?.value;

    if (!!preferredLanguage) {
        if (urlLocale != preferredLanguage) {
            return NextResponse.redirect(
                new URL(`/${preferredLanguage}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
            );
        }
        return;
    } else {
        if (urlLocale !== browserLanguage) {
            return NextResponse.redirect(
                new URL(`/${browserLanguage}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
            );
        }
        return;
    }
}
