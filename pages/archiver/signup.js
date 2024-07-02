import cookieCutter from "cookie-cutter";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { T } from "@tolgee/react";
import jwt from "jsonwebtoken";

export default function ArchiverSignup() {
    const router = useRouter();

    const signUp = async () => {
        const response = await fetch("/api/archiver/signup");
        const data = await response.json();

        if (data.success) {
            cookieCutter.set("archiverToken", data.token, {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                path: "/",
            });
            router.push("/archiver/manage");
        } else {
            alert("An error occurred. Please try again.");
        }
    };

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            <T keyName="archiverSignupTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="archiverSignupDescription" />
        </p>

        <div className="grid gap-4 mt-4">
            <button
                onClick={signUp}
                className={`
                    text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                <T keyName="archiverSignupButton" />
            </button>
        </div>
    </>);
};

export async function getServerSideProps(context) {
    const { req, res } = context;
    const archiverToken = getCookie("archiverToken", { req, res });

    if (archiverToken) {
        if (jwt.decode(archiverToken, process.env.SIGNATURE_SECRET)) {
            return {
                redirect: {
                    destination: "/archiver/manage",
                    permanent: false,
                }
            };
        }
    }

    return {
        props: {},
    };
};