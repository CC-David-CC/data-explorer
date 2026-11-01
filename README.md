# Data Explorer

Perspective supplies the interactive data grid, grouping/pivot controls and
charts. Its DuckDB virtual-server adapter runs SQL against DuckDB-Wasm in the
browser; there is no separate database server. Choose **Open from My files**, or
enter a CSV or TSV path and select Open path. TSV files use tab delimiters; quoted fields may contain tabs or commas. Run a SELECT query to show its results,
then use the viewer settings to filter, group, pivot or choose a chart. Choose
a save folder and select **Save results CSV** to save the SQL result to My files;
the result is written to browser storage first and then synchronized.

**Save analysis** writes a `.codi-data.json` project to My files. It stores the
SQL and Perspective settings plus the source CSV or TSV path and content hash; the
source is a separate file and must remain available. Open the project from Files or the
app to restore the query and chart. If its source has changed, the app asks
before using the current source file; if the source is missing, restore it in My files
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

For a fresh checkout, install the shared app-builder and test dependencies with
`npm ci --prefix active-system/tools/app-builder --ignore-scripts` and
`npm ci --prefix tests --ignore-scripts`, then install this app's dependencies
using the command above. Build it with
`python3 active-system/scripts/build-public-apps.py --apps data-explorer --output .build/data-explorer-test`.
The pinned packages supply DuckDB, Perspective, their workers and WebAssembly;
they are not separate files an app author must hand-copy into the checkout.
For an account-backed local preview, create `.venv` and install
`active-system/requirements.lock`, then run
`.venv/bin/python active-system/scripts/run-simplified-local.py --port 18310 --isolated --apps-bundle .build/data-explorer-test`.

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

The app keeps the earlier results and viewer settings if a new
query fails during the switch to its result. Viewer controls are temporarily
unavailable while the query runs. If restoring the earlier view also fails,
the app says so and suggests reopening the source file.

The local startup-retry candidate releases partially initialized resources and
allows another open after a worker fails to start. An injected worker-constructor
failure and the existing phone-sized account workflow passed locally; other
startup failure points remain unverified.

**Create example CSV** creates `/Example-resistance.csv` in My files and opens it. The values are synthetic, not laboratory measurements. Open **Example: calculate resistance** and choose **Use example query**, then **Run SQL**; the example yields 1,000 ohms by converting milliamps to amps. An existing file with that name is not replaced. If the current analysis changes while the file is being created, it stays open and the example can be opened later.

Closing during an analysis-project save or results CSV export asks for
confirmation, including when the analysis was previously clean. A write
already sent to storage may still finish after closing.

Chart and viewer-setting changes made while a project save or CSV export is
in progress remain marked unsaved. Save the analysis again to keep them.

Queries must contain a single SELECT or WITH statement. A trailing semicolon
and semicolons inside quoted strings, quoted identifiers or comments are
accepted. Result-table creation also uses a DuckDB prepared statement. These
checks prevent the tested multi-statement mistake; they are not a general SQL
security sandbox.

Local desktop and emulated-phone tests cover TSV selection, quoted tabs and
commas, DuckDB SQL, a synced analysis project, fresh-session reopen, and a
changed-source notice. Files opens CSV and TSV files in Data Explorer; desktop
and emulated-phone checks cover the TSV handoff. Physical touch is not verified.

If the file used to restore a window is missing or invalid, the failed association is cleared. The original file is untouched; open another data file or create the example, then save a new analysis. A saved project with a missing source retains its restore reference so it can be retried after the source is restored. Local desktop/phone and live emulated-phone account tests cover fallback, example, sync and refresh.

Only one My files chooser can be active in a window. If another open action
supersedes a delayed chooser, its old result is ignored; closing the window
also prevents a late result from opening anything. Local desktop and
emulated-phone account tests cover the chooser ordering, saving an analysis,
server synchronization and fresh-session reopening. Physical touch is not
verified by those tests.

If opening data fails and the previous view cannot be restored, the app reports
that failure and requires reopening the source before running SQL or saving an
analysis or results. The app stages the new result before the viewer can use
it and restores the old data table if opening fails. Local desktop and
emulated-phone account tests inject candidate-view and restoration failures,
check that no page error occurs, and reopen the original source and sync results.
A separate single-failure test confirms the old view and data remain usable.
Retaining temporary results for recovery may consume extra memory until another
source opens or the window closes; other failures and physical touch remain
unverified.

The pinned DuckDB-Wasm 1.32.0 worker is built as an app-local module with a
hash-checked patch binding missing Emscripten exception helpers to the WASM
exports. The earlier `_setThrew is not defined` error was reproduced on the
unchanged worker. Local desktop and emulated-phone failed-query/restore tests
pass with the patch without page errors. This does not prove all worker error
or memory conditions have been tested.

Only one project or results folder picker can be open at once. Open and save
operations are unavailable until it closes. If the destination path changes while the
picker is open, the new path is preserved and you can choose the folder again;
closing the app discards a late picker result. Local desktop and phone-sized
account tests cover these cases and project/CSV save, sync and fresh reopen;
physical touch has not been verified.

A temporary account-storage read error or conflict during window restoration retains the saved analysis or data reference and offers **Retry saved analysis or data**. Retry asks before replacing unsaved SQL edits; cancel leaves both the edits and retry option intact. Successfully opening another data file clears the recovery target. Local registered-account desktop and emulated-phone tests covered an injected project-read failure, cancellation, retry, real SQL, saving and server sync. Physical touch, conflict retries and all storage failure modes remain unverified.
