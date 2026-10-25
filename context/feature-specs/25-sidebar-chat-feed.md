Add real-time room chat to the AI sidebar using a separate Liveblocks `ai-chat` feed.

This is only for chat messages. Keep it separate from `ai-status-feed`, which handles AI progress and presence updates.

## Implementation

1. Add the `ai-chat` feed.

   Before implementing, check the existing Liveblocks setup and follow the same feed patterns already used in the project.
   - create or reuse a Liveblocks feed named `ai-chat`
   - keep it room-scoped
   - do not mix it with `ai-status-feed`

2. Wire the chat feed into the sidebar Chat tab.
   - subscribe to `ai-chat` in the Chat tab
   - render chat messages in order
   - show sender, timestamp, and message content
   - keep the styling consistent with the existing sidebar UI
   - use Tailwind utilities and existing shadcn components where they fit
   - AI Architect can show the same feed, but Chat is the dedicated room-chat surface

3. Add message sending.
   - allow users in the room to send messages to `ai-chat`
   - use the Chat tab input and send button
   - clear the input after a successful send
   - show a small error state if sending fails
   - do not start a design run from the Chat tab

4. Add message validation.
   - define or reuse a Zod schema in `types/tasks.ts`
   - message shape should include sender, role, content, and timestamp
   - validate feed messages before rendering them

## Scope Limits

- don’t add AI-generated replies yet
- don’t trigger backend AI tasks
- don’t mix chat messages with status messages
- don’t create a parallel realtime system outside Liveblocks
- keep this focused on collaborative sidebar chat only

## Check When Done

- Sidebar Chat tab subscribes to the `ai-chat` feed.
- Users can send chat messages through the Chat tab input.
- Chat messages are validated before rendering.
- `ai-chat` remains separate from `ai-status-feed`.
- `npm run build` passes.
