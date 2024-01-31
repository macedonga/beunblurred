import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";

function Error({ statusCode }) {
    const router = useRouter();

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            Error {statusCode}
        </h1>
        <p className="text-center mt-2">
            {statusCode === 404
                ? `Looks like this page doesn't exist.`
                : statusCode === 500
                    ? `Looks like something went wrong on the server side. Try logging out and logging back in.`
                    : `An error occurred on client`}
        </p>

        <button
            className={`
                flex bg-white/5 mt-4
                relative border-2 border-white/10
                rounded-lg px-4 py-2 min-w-0 justify-center
                text-white/75 font-medium w-full
            `}
            onClick={() => router.push("/feed")}
        >
            Go to feed
        </button>

        <button
            className={`
                flex bg-white/5 mt-4
                relative border-2 border-white/10
                rounded-lg px-4 py-2 min-w-0 justify-center
                text-white/75 font-medium w-full
            `}
            onClick={() => router.push("/logout")}
        >
            Logout
        </button>
    </>);
}

Error.getInitialProps = async (ctx) => {
    await Sentry.captureUnderscoreErrorException(ctx);
    const statusCode = ctx.res ? ctx.res.statusCode : ctx.err ? ctx.err.statusCode : 404;
    return { statusCode };
}

export default Error;
