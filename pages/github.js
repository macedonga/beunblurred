export default function Github() {
    return (<></>);
}

export async function getServerSideProps(context) {
    return {
        redirect: {
            destination: "https://github.com/macedonga/beunblurred",
            permanent: true,
        },
    };
}