# Tab Groups Implementation

Tab Groups extend the existing tab architecture rather than adding a second tab
manager. Renderer-owned `TabGroup` metadata (name, color, order, and collapsed
state) is persisted in the existing `nexus_tab_groups` local-storage entry.
Tab membership remains the `groupId` already carried by `TabState` and the
existing tab/session APIs. New session writes do not duplicate group metadata;
legacy session data containing a `groups` field remains readable.

The horizontal `TitleBar` and `VerticalTabBar` are the only tab presentation
surfaces. Their group headers expose the same management menu and editor. Group
collapse filters tab rows only; tab identifiers, active selection, and
`WebContentsView` instances are unchanged. Membership updates use the existing
`tabs:setGroup` IPC contract. Invalid memberships are cleared when they are
observed in renderer tab updates.

The main-process session store currently saves sessions but the application
does not restore those sessions at startup. Group metadata therefore restores
through the existing renderer local-storage path; tab membership is preserved
in saved tab records and recently closed records where those records are
restored by existing flows.
