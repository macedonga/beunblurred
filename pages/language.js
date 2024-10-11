import { useRouter } from "next/router";
import cookieCutter from "cookie-cutter";
import { T, useTranslate } from "@tolgee/react";
import {
    US,
    IT,
    DE,
    ES,
    FR,
    NL,
    PL,
    IL,
    JP
} from "country-flag-icons/react/3x2";

export default function LanguageSelector() {
    const { t } = useTranslate();
    const router = useRouter();

    const availableLanguages = [
        {
            "code": "en",
            "name": "English",
            "nativeName": "English",
            "flag": US
        },
        {
            "code": "it",
            "name": "Italian",
            "nativeName": "Italiano",
            "flag": IT
        },
        {
            "code": "de",
            "name": "German",
            "nativeName": "Deutsch",
            "flag": DE
        },
        {
            "code": "es",
            "name": "Spanish",
            "nativeName": "Español",
            "flag": ES
        },
        {
            "code": "fr",
            "name": "French",
            "nativeName": "Français",
            "flag": FR
        },
        {
            "code": "nl",
            "name": "Dutch",
            "nativeName": "Nederlands",
            "flag": NL
        },
        {
            "code": "pl",
            "name": "Polish",
            "nativeName": "Polski",
            "flag": PL
        },
        {
            "code": "he",
            "name": "Hebrew",
            "nativeName": "עברית",
            "flag": IL
        },
        {
            "code": "jp",
            "name": "Japanese",
            "nativeName": "日本語",
            "flag": JP
        }
    ];

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            <T keyName="languageSelectorTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="languageSelectorDesc" params={{ a: <a href="/github" target="_blank" rel="noopener noreferrer" className="link" /> }} />
        </p>

        <div className="grid gap-4 mt-4">
            {
                availableLanguages.map((lang, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            cookieCutter.set("preferredLanguage", lang.code, { path: "/", expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
                            router.reload();
                        }}
                        className={`
                            flex items-center justify-center
                            bg-white/5
                            border-2 border-white/10
                            rounded-lg px-4 py-2 min-w-0
                            text-white/75 font-medium
                        `}
                    >
                        <span className="mr-2">
                            <lang.flag
                                className="w-6 h-6"
                            />
                        </span>
                        <span>
                            {lang.nativeName}
                        </span>
                    </button>
                ))
            }
        </div>
    </>);
}