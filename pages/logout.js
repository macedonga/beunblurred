import { deleteCookie } from "cookies-next";

export default function Logout(props) {
    return (<>
        Logging out...
    </>)
}

export async function getServerSideProps({ req, res }) {
    [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
        "user",
        "testMode"
    ].forEach(n =>
        deleteCookie(n, { req, res })
    );

    return {
        redirect: {
            destination: "/",
            permanent: false
        }
    };
};