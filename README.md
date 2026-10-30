# Data Explorer

Perspective supplies the interactive data grid, grouping/pivot controls and
charts. Its DuckDB virtual-server adapter runs SQL against DuckDB-Wasm in the
browser; there is no separate database server. Open a CSV from Files, or enter
its path and select Open. Run a SELECT query to show its results, then use the
viewer settings to filter, group, pivot or choose a chart.

This first version opens CSV files up to 32 MiB. The source stays in the
account's browser/server file mirror; the database, queries and visualization
settings are temporary and are not saved when the window closes. It does not yet
open DuckDB database files or save query results. Extension auto-install/loading
is disabled so SQL won't download DuckDB extensions. DuckDB and Perspective
assets load only when the app is opened; the first load is roughly 44 MiB.
Charts require browser worker graphics support. The upstream virtual-server
client currently logs an unhandled unsubscribe request while closing the viewer;
this has not prevented disposal in the browser test.

The two exact-hash build patches prevent dynamic imports from outside the
reviewed app bundle. Viewer initialization explicitly supplies its bundled WASM
module. Chart fallback that would dynamically import a blob is disabled; the
worker graphics path is used. Run `npm ci --prefix apps/system/data-explorer
--ignore-scripts` before building. Third-party licenses are packaged with the
built app; dependencies and generated assets are not committed.
