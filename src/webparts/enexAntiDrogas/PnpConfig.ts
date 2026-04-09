import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFI, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/views";
import "@pnp/sp/site-users/web";

let _sp: SPFI | undefined = undefined;

export const getSP = (context?: WebPartContext): SPFI => {
    if (context !== undefined) {
        _sp = spfi().using(SPFx(context));
    }

    if (_sp === undefined) {
        console.error("PnP JS was not initialized! getSP called without context before onInit.");
        // We throw as a last resort to avoid "cannot read properties of undefined"
        throw new Error("PnP JS not initialized. Call getSP(context) in WebPart onInit first.");
    }

    return _sp;
};
