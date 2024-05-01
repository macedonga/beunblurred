import { T } from "@tolgee/react";

export default function Donate() {
    const donationGateways = [
        {
            name: "PayPal",
            href: "https://paypal.me/macedonga",
        },
        {
            name: "Buy Me a Coffee",
            href: "https://www.buymeacoffee.com/macedonga",
        },
        {
            name: "GitHub sponsors",
            href: "https://github.com/sponsors/macedonga"
        },
        {
            name: "Stripe",
            href: "https://marco.win/donate"
        }
    ];

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            <T keyName="donatePageTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="donationTitle" />
        </p>

        <div className="grid gap-4 mt-4">
            {
                donationGateways.map((gateway, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            localStorage.setItem("donationDismissed", "true");
                            window.open(gateway.href, "_blank");
                        }}
                        className={`
                            flex items-center justify-center
                            bg-white/5
                            border-2 border-white/10
                            rounded-lg px-4 py-2 min-w-0
                            text-white/75 font-medium
                        `}
                    >
                        <p>
                            <T keyName="donateVia" params={{ name: gateway.name }} />
                        </p>
                    </button>
                ))
            }
        </div>
    </>);
}