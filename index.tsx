/*
* Vencord, a Discord client mod
* Copyright (c) 2024 jesusqc
* SPDX-License-Identifier: GPL-3.0-or-later
*/

import "./style.css";

import definePlugin from "@utils/types";
import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import { addMessagePreSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { MoreEmotesButton, MoreEmotesPicker } from "./components/MoreEmotesComponents";
import { emoteSearchReplacer } from "./api/seventv";

export default definePlugin({
    name: "MoreEmotes",
    description: "Expand your emote game with a custom 7TV emote picker!",
    authors: [{ name: "jesusqc", id: 430960270433845249n }],

    /*
       Hear me out, I wasn't able to get what function to call to open the vanilla emote picker in 30 mins,
       so I surrendered and made my own emote picker, if someone knows how to open the fucking vanilla emote picker let me know,

       Anyways, this works just as fine, the patch is a bit hacky but it works, really tried to speedrun this.
    */
    patches: [
        {
            find: "hasStackedBar]",
            replacement: {
                match: /null:\((.*?)\)\((.*?)\)(.*?)chatInputType:(.*?)}/,
                replace: "null:($1)($self.MoreEmotesPicker,{children:[($1)($2)],chatInputType:$4})$3chatInputType:$4}"
            }
        }
    ],

    start() {
        addChatBarButton("MoreEmotes", MoreEmotesButton);
        /* We convert to an emote any message that goes like :+EMOTE NAME: */
        this.preSend = addMessagePreSendListener(async (_, msg) => {
            if (!msg.content || !msg.content.startsWith(":+") || !msg.content.endsWith(":"))
                return;

            msg.content = await emoteSearchReplacer(msg.content.slice(2, -1));
        });
    },

    stop() {
        removeChatBarButton("MoreEmotes");
        removeMessagePreSendListener(this.preSend);
    },

    MoreEmotesPicker
});
