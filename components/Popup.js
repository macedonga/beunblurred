import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { T, useTranslate } from "@tolgee/react";

export default function Popup({
    title,
    description,
    show,
    onClose,
    children,
    containerStyle,
    customPanelClassname,
    closeButtonText,
    dontCloseOnOverlayClick,
    loadingDisabled,
    titleParams = {},
    containerClassName = "",
    descriptionParams = {}
}) {
    const { t } = useTranslate();

    useEffect(() => {
        if (!window) return;

        if (!show) {
            document.documentElement.style.overflow = null;
        }
    }, [show]);

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={!dontCloseOnOverlayClick ? onClose : () => { }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black backdrop-blur bg-opacity-25" />
                </Transition.Child>

                <div className="fixed lg:inset-0 bottom-0 inset-x-0 overflow-y-hidden w-full">
                    <div className="flex min-h-full items-center justify-center text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-100"
                            enterFrom="bottom-0 opacity-0 lg:scale-95 translate-y-10 lg:translate-y-0 translate-x-0"
                            enterTo="opacity-100 lg:scale-100 translate-y-0 translate-x-0"
                            leave="ease-in duration-75"
                            leaveFrom="opacity-100 lg:scale-100 translate-y-0 translate-x-0"
                            leaveTo="opacity-0 lg:scale-95 translate-y-10 lg:translate-y-0 translate-x-0"
                        >
                            <Dialog.Panel
                                className={`
                                    ${customPanelClassname || ""}
                                    lg:max-w-md max-w-none w-full z-[70]
                                    transform overflow-hidden rounded-t-lg lg:rounded-b-lg mx-4 max-h-[90vh]
                                    border-2 border-white/10 bg-[#0d0d0d] lg:border-b-2 border-b-0
                                    text-left align-middle shadow-xl transition-all overflow-y-auto
                                `}
                                style={containerStyle}
                            >
                                <div className="m-6 mb-4 pb-4 border-b-2 border-white/10">
                                    <Dialog.Title
                                        as="h2"
                                        className={"m-0 text-center text-2xl font-bold"}
                                    >
                                        <T keyName={title} params={titleParams} />
                                    </Dialog.Title>
                                    <p
                                        className={"m-0 text-center opacity-75 text-sm mt-2"}
                                    >
                                        <T keyName={description} params={descriptionParams} />
                                    </p>
                                </div>

                                <div className={containerClassName}>
                                    <div className="mx-6 mb-2 mt-2">{children}</div>

                                    <div className="grid gap-y-4 mb-6 mx-6">
                                        <button
                                            disabled={loadingDisabled}
                                            className={`
                                            text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                        `}
                                            onClick={onClose}
                                        >
                                            <T keyName={closeButtonText || "close"} />
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}