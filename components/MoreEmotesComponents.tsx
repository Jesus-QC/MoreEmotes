/*
* Vencord, a Discord client mod
* Copyright (c) 2024 jesusqc
* SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ChatBarButton } from "@api/ChatButtons";
import { TextInput, useState, useEffect, useRef } from "@webpack/common";
import { EmoteItem, formatEmote, searchEmotes } from "../api/seventv";
import { getCurrentChannel, sendMessage } from "@utils/discord";

const DEBOUNCE_RATELIMIT_MS = 300;

/* Could have made this infinite scroll but again too lazy for it */
const MAX_EMOTES_PER_SEARCH = 100;

/* Stole from the one they use for the twitch extension ;) */
const SevenTvIcon = () => {
    return <svg width="24px" height="24px" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 23.551">
        <path d="M2.383,0,0,4.127,1.473,6.676H11.7L3.426,21,4.9,23.551H9.66Q14.532,15.113,19.4,6.676L15.549,0ZM18.492,0l3.856,6.676h2.945l2.381-4.125L26.2,0Zm2.383,9.225L17.021,15.9l4.417,7.649H26.2L33,11.775l-1.473-2.55H26.764l-2.944,5.1Z"></path>
    </svg>;
};

/*
    Again, not my proudest code, (even though I am not a fucking typescript dev)
    but yeah, didn't feel like spending more time on this, and making another patch
    for a provider felt like a waste of time, so here we are, this works just fine.
*/
const emotePickerHook = {
    showPicker: false,
    setShowPicker(_: boolean) { }
};

/* The chat bar button */
export const MoreEmotesButton: ChatBarButton = ({ isMainChat }) => {
    if (!isMainChat) return null;

    return <>
        <ChatBarButton tooltip="More Emotes" onClick={() => {
            emotePickerHook.setShowPicker(!emotePickerHook.showPicker);
        }}>
            <SevenTvIcon />
        </ChatBarButton>;
    </>;
};

/* The emote picker... */
export const MoreEmotesPicker = ({ children, chatInputType }) => {
    [emotePickerHook.showPicker, emotePickerHook.setShowPicker] = useState(false);
    const [emotes, setEmotes] = useState<EmoteItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [_, setRatelimited] = useState(false);
    const pickerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setRatelimited(true);
        }, DEBOUNCE_RATELIMIT_MS);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        if (!emotePickerHook.showPicker)
            return;

        const handler = setTimeout(async () => {
            const newEmotes = await searchEmotes(searchQuery ?? "", MAX_EMOTES_PER_SEARCH);
            if (newEmotes) setEmotes(newEmotes);
        }, DEBOUNCE_RATELIMIT_MS);

        return () => {
            clearTimeout(handler);
        };
    }, [emotePickerHook.showPicker, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                emotePickerHook.setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleButtonClick = (emote: EmoteItem) => {
        const channelId = getCurrentChannel()?.id;
        if (channelId) {
            sendMessage(channelId, {
                content: formatEmote(emote.id),
            });
        }
        emotePickerHook.setShowPicker(false);
    };

    return (
        <>
            {chatInputType.analyticsName === "normal" && emotePickerHook.showPicker && (
                <div className="more-emotes-picker" ref={pickerRef}>
                    <div className="more-emotes-search">
                        <SevenTvIcon />
                        <TextInput
                            type="text"
                            placeholder="Search emotes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e)}
                            autoFocus={true}
                        />
                    </div>
                    <div className="more-emotes-list">
                        {emotes.map((emote) => (
                            <div
                                key={emote.id}
                                onClick={() => handleButtonClick(emote)}
                            >
                                <img src={formatEmote(emote.id)} alt={emote.defaultName} />
                                <span>{emote.defaultName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {children}
        </>
    );
};
