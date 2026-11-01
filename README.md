# Data Explorer

Perspective supplies the interactive data grid, grouping/pivot controls and
charts. Its DuckDB virtual-server adapter runs SQL against DuckDB-Wasm in the
browser; there is no separate database server. Choose **Open from My files**, or
enter a CSV path and select Open path. Run a SELECT query to show its results,
then use the viewer settings to filter, group, pivot or choose a chart. Choose
a save folder and select **Save results CSV** to save the SQL result to My files;
the result is written to browser storage first and then synchronized.

**Save analysis** writes a `.codi-data.json` project to My files. It stores the
SQL and Perspective settings plus the source CSV path and content hash; the CSV
is a separate file and must remain available. Open the project from Files or the
app to restore the query and chart. If its source has changed, the app asks
before using the current CSV; if the source is missing, restore it in My files
before opening the project. Unsaved SQL and viewer-setting changes prompt before
closing or opening another file. Run the current SQL before saving the project. Save checks the source hash and existing destination version using My files metadata without rereading their contents.
The save-location controls and **Save results CSV** are under **Save locations
and CSV export**. Results CSV contains the SQL result, not a chart or the
viewer's additional filters and pivots.

CSV input and results may be up to 128 MiB, but DuckDB and Perspective need
additional working memory; large datasets may fail on memory-constrained
devices. A local test opened and queried a CSV larger than 32 MiB; the full
128 MiB limit has not been verified in this app. It does not open DuckDB
database files. Extension auto-install/loading is disabled so SQL won't
download DuckDB extensions. DuckDB and Perspective assets load only when the
app opens; the first load is roughly 44 MiB. Charts require browser worker
graphics support. The upstream virtual-server client currently logs an
unhandled unsubscribe request while closing the viewer; this has not prevented
disposal in the browser test.

The two exact-hash build patches prevent dynamic imports from outside the
reviewed app bundle. Viewer initialization explicitly supplies its bundled WASM
module. Chart fallback that would dynamically import a blob is disabled; the
worker graphics path is used. Run `npm ci --prefix apps/system/data-explorer
--ignore-scripts` before building. Third-party licenses are packaged with the
built app; dependencies and generated assets are not committed.

When My files detects that the open source CSV has changed, has conflicting copies, or is unavailable, Data Explorer shows a persistent notice. The current analysis continues to use the data loaded earlier; reopen the source to analyze its current contents. Detection depends on the account mirror checking the server, so it is not an instantaneous server notification.

The saved analysis project has its own persistent notice when the mirror finds
that it has changed, been deleted, become unavailable, or has conflicting copies.
Your current analysis remains open; save a copy, reopen it, or resolve conflicts
in Files. A conflict returned by a project save is also reported immediately.

Project and results saves use the destination entered when Save was selected, even if the path is edited while the save is in progress.

Desktop dialogs confirm discarding settings, replacing files and opening a
project whose source CSV changed. Edits made while confirmation is open stay
in the editor. Project saves recheck the source after replacement confirmation
so a changed CSV is not silently recorded as the earlier version.

Editing SQL marks the displayed results as belonging to an earlier query. Run the current SQL before saving results; if SQL changes during an export, the saved CSV is identified as an earlier result. An immediate conflicting-copy result is reported for resolution in Files.

**Create example CSV** creates `/Example-resistance.csv` in My files and opens it. The values are synthetic, not laboratory measurements. Open **Example: calculate resistance** and choose **Use example query**, then **Run SQL**; the example yields 1,000 ohms by converting milliamps to amps. An existing file with that name is not replaced. If the current analysis changes while the file is being created, it stays open and the example can be opened later.
