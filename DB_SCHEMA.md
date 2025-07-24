\[

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "jobid",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "nextval('cron.jobid\_seq'::regclass)"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "schedule",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "command",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "nodename",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'localhost'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "nodeport",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "inet\_server\_port()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "database",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "current\_database()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "username",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "CURRENT\_USER"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "jobname",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "jobid",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "runid",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "nextval('cron.runid\_seq'::regclass)"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "job\_pid",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "database",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "username",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "command",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "return\_message",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "start\_time",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "cron",

&nbsp;   "table\_name": "job\_run\_details",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "end\_time",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "userid",

&nbsp;   "data\_type": "oid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "dbid",

&nbsp;   "data\_type": "oid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "toplevel",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "queryid",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "query",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "plans",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "total\_plan\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "min\_plan\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "max\_plan\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "mean\_plan\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "stddev\_plan\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "calls",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "total\_exec\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "min\_exec\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "max\_exec\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "mean\_exec\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "stddev\_exec\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "rows",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "shared\_blks\_hit",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 20,

&nbsp;   "column\_name": "shared\_blks\_read",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 21,

&nbsp;   "column\_name": "shared\_blks\_dirtied",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 22,

&nbsp;   "column\_name": "shared\_blks\_written",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 23,

&nbsp;   "column\_name": "local\_blks\_hit",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 24,

&nbsp;   "column\_name": "local\_blks\_read",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 25,

&nbsp;   "column\_name": "local\_blks\_dirtied",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 26,

&nbsp;   "column\_name": "local\_blks\_written",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 27,

&nbsp;   "column\_name": "temp\_blks\_read",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 28,

&nbsp;   "column\_name": "temp\_blks\_written",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 29,

&nbsp;   "column\_name": "shared\_blk\_read\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 30,

&nbsp;   "column\_name": "shared\_blk\_write\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 31,

&nbsp;   "column\_name": "local\_blk\_read\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 32,

&nbsp;   "column\_name": "local\_blk\_write\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 33,

&nbsp;   "column\_name": "temp\_blk\_read\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 34,

&nbsp;   "column\_name": "temp\_blk\_write\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 35,

&nbsp;   "column\_name": "wal\_records",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 36,

&nbsp;   "column\_name": "wal\_fpi",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 37,

&nbsp;   "column\_name": "wal\_bytes",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 38,

&nbsp;   "column\_name": "jit\_functions",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 39,

&nbsp;   "column\_name": "jit\_generation\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 40,

&nbsp;   "column\_name": "jit\_inlining\_count",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 41,

&nbsp;   "column\_name": "jit\_inlining\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 42,

&nbsp;   "column\_name": "jit\_optimization\_count",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 43,

&nbsp;   "column\_name": "jit\_optimization\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 44,

&nbsp;   "column\_name": "jit\_emission\_count",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 45,

&nbsp;   "column\_name": "jit\_emission\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 46,

&nbsp;   "column\_name": "jit\_deform\_count",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 47,

&nbsp;   "column\_name": "jit\_deform\_time",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 48,

&nbsp;   "column\_name": "stats\_since",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements",

&nbsp;   "column\_order": 49,

&nbsp;   "column\_name": "minmax\_stats\_since",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements\_info",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "dealloc",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "extensions",

&nbsp;   "table\_name": "pg\_stat\_statements\_info",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "stats\_reset",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "status\_code",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "content\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "headers",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "content",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "timed\_out",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "error\_msg",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "\_http\_response",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "nextval('net.http\_request\_queue\_id\_seq'::regclass)"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "method",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "url",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "headers",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "body",

&nbsp;   "data\_type": "bytea",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "net",

&nbsp;   "table\_name": "http\_request\_queue",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "timeout\_milliseconds",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "timezone('utc'::text, now())"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "path",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "method",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "status\_code",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "response\_time\_ms",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "api\_request\_metrics",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "appointment\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "session\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "file\_path",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "file\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "file\_size",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "mime\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "uploaded\_by",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "extra\_service\_session\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_evidence",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "appointment\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_extra\_services",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "appointment\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "unit\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "total\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_products",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "appointment\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "started\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "ended\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "duration\_minutes",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointment\_sessions",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "client\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "appointment\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "appointment\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "'Confirmada'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "total\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "appointments",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "attention\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "unit\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "total\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_products",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "attention\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "attention\_service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "unit\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "total\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "commission\_rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_service\_products",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "attention\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "service\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "service\_order",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'Pendiente'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attention\_services",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "client\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "attention\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "attention\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'Confirmada'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "total\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "attentions",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "action",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "entity\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "entity\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "old\_value",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "new\_value",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "ip\_address",

&nbsp;   "data\_type": "inet",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "user\_agent",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "object\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "object\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "audit\_logs",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "metadata",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branch\_status\_history",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "nextval('branch\_status\_history\_id\_seq'::regclass)"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branch\_status\_history",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branch\_status\_history",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "USER-DEFINED",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branch\_status\_history",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "changed\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branch\_status\_history",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "changed\_by",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "address",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "language\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "timezone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "is\_main\_branch",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "USER-DEFINED",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'pending\_activation'::branch\_status"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "branches",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "activated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "brands",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "phone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "clients",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "iso\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "timezone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "default\_language\_iso\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "uses\_auto\_pricing",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "default\_currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "default\_localization\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "phone\_prefix\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "default\_latitude",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "countries",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "default\_longitude",

&nbsp;   "data\_type": "double precision",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "symbol",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "format",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "symbol\_position",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'before'::character varying"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "decimal\_separator",

&nbsp;   "data\_type": "character",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'.'::bpchar"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "thousands\_separator",

&nbsp;   "data\_type": "character",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "','::bpchar"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "currencies",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "decimal\_places",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "2"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "recipient\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "template\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "error\_message",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "sent\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_logs",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "recipient\_user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "template\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "template\_data",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "USER-DEFINED",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'PENDING'::email\_queue\_status"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "attempts",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "last\_attempt\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "error\_message",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_queue",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "template\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "subject",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "body\_html",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "language\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "email\_templates",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "propagate\_to\_new\_tenants",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "error\_message",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "stack\_trace",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "error\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "severity",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'error'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "error\_logs",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "exchange\_rates",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "exchange\_rates",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "base\_currency\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "exchange\_rates",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "target\_currency\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "exchange\_rates",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "exchange\_rates",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "last\_updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "extra\_service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "appointment\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "started\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "ended\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "duration\_minutes",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "extra\_service\_sessions",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "country\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "generic\_taxes",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "base\_currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "default\_tax\_rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0.00"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "default\_tax\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "'IVA'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "company\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "contact\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "address",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "trial\_duration\_days",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "14"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "global\_settings",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "trial\_grace\_period\_days",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "3"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "method",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "config\_schema",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_auth\_methods",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_body\_formats",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_body\_formats",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "format",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_body\_formats",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_body\_formats",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_body\_formats",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "slug",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_categories",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_http\_methods",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_http\_methods",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "method",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_http\_methods",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_http\_methods",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_http\_methods",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "logo\_url",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "country\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "category\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "endpoints",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "config\_schema",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "api\_schema",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "slug",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "http\_method\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "body\_format\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "auth\_method\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "http\_headers",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "authentication\_config",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "body\_template",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_providers",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "response\_mapping",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "provider",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "access\_token",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "encrypted\_refresh\_token",

&nbsp;   "data\_type": "bytea",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "encryption\_nonce",

&nbsp;   "data\_type": "bytea",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "account\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integration\_record",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integrations\_config",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "key",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "integrations\_config",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "value",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "invoice\_item\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "tax\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "taxable\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "calculated\_tax\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_item\_taxes",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "invoice\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "subscription\_plan\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "item\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "unit\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "total\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoice\_items",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "billed\_to\_tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "billed\_to\_client\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "invoice\_number",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "issue\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "due\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "subtotal\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "total\_tax\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "total\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'draft'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "invoices",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "iso\_code",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "languages",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "role\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "menu\_item\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "can\_access",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "menu\_permissions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "token",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "expires\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "password\_reset\_tokens",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "used\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'PENDING'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "amount\_in\_cents",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "currency",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "reference",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "metadata",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "'{}'::jsonb"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payment\_intents",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "environment",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "provider",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "provider\_payment\_id",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "amount\_in\_cents",

&nbsp;   "data\_type": "bigint",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "currency",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "reference",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "environment",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "full\_response",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "payment\_date",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "payments",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "metric\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "metric\_value",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "timestamp",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "performance\_metrics",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "permissions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "phone\_prefixes",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "phone\_prefixes",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "country\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "phone\_prefixes",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "iso\_code",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "phone\_prefixes",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "prefix",

&nbsp;   "data\_type": "character varying",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "phone\_prefixes",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "subscription\_plan\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "base\_price\_cop",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "extra\_branch\_price\_cop",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "effective\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "plan\_price\_history",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "commission\_rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "product\_stylist\_commissions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "stock\_quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "category",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "cost\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "last\_purchase\_cost",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "average\_cost",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "brand\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "min\_stock",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "max\_stock",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "100"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "barcode",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "sku",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 20,

&nbsp;   "column\_name": "name\_i18n",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "products",

&nbsp;   "column\_order": 21,

&nbsp;   "column\_name": "description\_i18n",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "purchase\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "unit\_cost",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "total\_cost",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchase\_items",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "supplier\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "purchase\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "CURRENT\_DATE"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "invoice\_number",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "total\_amount",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "'Completada'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "supplier\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "purchases",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "roles",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "roles",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "roles",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "roles",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "roles",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "schedule\_templates",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_categories",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "service\_session\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "attention\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "file\_path",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "file\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "file\_size",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "mime\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "uploaded\_by",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_evidence",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "attention\_service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "started\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "ended\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "duration\_minutes",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_sessions",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "service\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "commission\_rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "can\_perform",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "service\_stylist\_commissions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "duration\_minutes",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "category\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "name\_i18n",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "services",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "description\_i18n",

&nbsp;   "data\_type": "jsonb",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "key",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "value",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "settings",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "day\_of\_week",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "start\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "end\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "template\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_schedules",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "stylist\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "start\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "end\_date",

&nbsp;   "data\_type": "date",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "start\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "end\_time",

&nbsp;   "data\_type": "time without time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'pending'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "reason",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "approved\_by",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "approved\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylist\_time\_off",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "specialties",

&nbsp;   "data\_type": "ARRAY",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "phone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "commission\_rate",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "50.00"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "stylists",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_subscription\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "asset\_type",

&nbsp;   "data\_type": "USER-DEFINED",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "asset\_reference\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "status",

&nbsp;   "data\_type": "USER-DEFINED",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'active'::subscription\_asset\_status"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "added\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "cancelled\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_assets",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "price\_at\_addition",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "subscription\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "item\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "item\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "quantity",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "unit\_price\_at\_addition",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "added\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_items",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "description",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "duration\_days",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "30"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "billing\_frequency\_months",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "1"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "display\_order",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "grace\_period\_days",

&nbsp;   "data\_type": "integer",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "7"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "subscription\_plans",

&nbsp;   "column\_order": 20,

&nbsp;   "column\_name": "features",

&nbsp;   "data\_type": "ARRAY",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "ARRAY\[]::text\[]"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "supplier\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "product\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "supplier\_price",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "0"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "supplier\_products",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "identification\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "identification\_number",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "address",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "phone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "suppliers",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "title",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "message",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "severity",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "system\_alerts",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "provider",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "access\_token",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "account\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "expires\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "encrypted\_credentials",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 12,

&nbsp;   "column\_name": "nonce",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 13,

&nbsp;   "column\_name": "environment",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'production'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_integrations",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "subscription\_plan\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "start\_date",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "end\_date",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_subscriptions",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "is\_trial",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "template\_type",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenant\_template\_settings",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "subscription\_status",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'trial'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "default\_language\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "default\_currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "default\_timezone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "contact\_person",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 10,

&nbsp;   "column\_name": "contact\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "contact\_phone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 14,

&nbsp;   "column\_name": "country\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "logo\_url",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "notes",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "legal\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "tax\_id",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 20,

&nbsp;   "column\_name": "billing\_address",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 21,

&nbsp;   "column\_name": "website",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 22,

&nbsp;   "column\_name": "whatsapp\_phone",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 23,

&nbsp;   "column\_name": "einvoicing\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 24,

&nbsp;   "column\_name": "physical\_address\_line1",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 25,

&nbsp;   "column\_name": "physical\_address\_line2",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 26,

&nbsp;   "column\_name": "physical\_city",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 27,

&nbsp;   "column\_name": "physical\_state",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 28,

&nbsp;   "column\_name": "physical\_postal\_code",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 29,

&nbsp;   "column\_name": "latitude",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 30,

&nbsp;   "column\_name": "longitude",

&nbsp;   "data\_type": "numeric",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 31,

&nbsp;   "column\_name": "commercial\_email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 32,

&nbsp;   "column\_name": "integrations\_mode",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "'production'::text"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "tenants",

&nbsp;   "column\_order": 33,

&nbsp;   "column\_name": "is\_system\_owner",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "false"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "offset\_str",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "timezones",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "language\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "key",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "value",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "context",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "translations",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "role\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_assignments",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "user\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "permission\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_permissions",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "password\_hash",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "tenant\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "branch\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "role\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 6,

&nbsp;   "column\_name": "first\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "last\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "avatar\_url",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "user\_record",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "tenant\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "gen\_random\_uuid()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "email",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "password\_hash",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 7,

&nbsp;   "column\_name": "is\_active",

&nbsp;   "data\_type": "boolean",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "true"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 8,

&nbsp;   "column\_name": "created\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 9,

&nbsp;   "column\_name": "updated\_at",

&nbsp;   "data\_type": "timestamp with time zone",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": "now()"

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 11,

&nbsp;   "column\_name": "currency\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 15,

&nbsp;   "column\_name": "first\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 16,

&nbsp;   "column\_name": "last\_name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 17,

&nbsp;   "column\_name": "avatar\_url",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 18,

&nbsp;   "column\_name": "country\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 19,

&nbsp;   "column\_name": "language\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "public",

&nbsp;   "table\_name": "users",

&nbsp;   "column\_order": 20,

&nbsp;   "column\_name": "timezone\_id",

&nbsp;   "data\_type": "uuid",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "schema\_migrations",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "version",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "schema\_migrations",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "statements",

&nbsp;   "data\_type": "ARRAY",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "schema\_migrations",

&nbsp;   "column\_order": 3,

&nbsp;   "column\_name": "name",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "schema\_migrations",

&nbsp;   "column\_order": 4,

&nbsp;   "column\_name": "created\_by",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "schema\_migrations",

&nbsp;   "column\_order": 5,

&nbsp;   "column\_name": "idempotency\_key",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "YES",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "seed\_files",

&nbsp;   "column\_order": 1,

&nbsp;   "column\_name": "path",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; },

&nbsp; {

&nbsp;   "table\_schema": "supabase\_migrations",

&nbsp;   "table\_name": "seed\_files",

&nbsp;   "column\_order": 2,

&nbsp;   "column\_name": "hash",

&nbsp;   "data\_type": "text",

&nbsp;   "is\_nullable": "NO",

&nbsp;   "column\_default": null

&nbsp; }

]

\[

&nbsp; {

&nbsp;   "routine\_schema": "cron",

&nbsp;   "function\_name": "alter\_job",

&nbsp;   "parameters": "job\_id bigint, schedule text, command text, database text, username text, active boolean",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "cron",

&nbsp;   "function\_name": "job\_cache\_invalidate",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "cron",

&nbsp;   "function\_name": "schedule",

&nbsp;   "parameters": "schedule text, job\_name text, schedule text, command text, command text",

&nbsp;   "return\_type": "bigint",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "cron",

&nbsp;   "function\_name": "schedule\_in\_database",

&nbsp;   "parameters": "job\_name text, schedule text, command text, database text, username text, active boolean",

&nbsp;   "return\_type": "bigint",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "cron",

&nbsp;   "function\_name": "unschedule",

&nbsp;   "parameters": "job\_id bigint, job\_name text",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "grant\_pg\_cron\_access",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "grant\_pg\_graphql\_access",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "grant\_pg\_net\_access",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "pg\_stat\_statements",

&nbsp;   "parameters": "showtext boolean, userid oid, dbid oid, toplevel boolean, queryid bigint, query text, plans bigint, total\_plan\_time double precision, min\_plan\_time double precision, max\_plan\_time double precision, mean\_plan\_time double precision, stddev\_plan\_time double precision, calls bigint, total\_exec\_time double precision, min\_exec\_time double precision, max\_exec\_time double precision, mean\_exec\_time double precision, stddev\_exec\_time double precision, rows bigint, shared\_blks\_hit bigint, shared\_blks\_read bigint, shared\_blks\_dirtied bigint, shared\_blks\_written bigint, local\_blks\_hit bigint, local\_blks\_read bigint, local\_blks\_dirtied bigint, local\_blks\_written bigint, temp\_blks\_read bigint, temp\_blks\_written bigint, shared\_blk\_read\_time double precision, shared\_blk\_write\_time double precision, local\_blk\_read\_time double precision, local\_blk\_write\_time double precision, temp\_blk\_read\_time double precision, temp\_blk\_write\_time double precision, wal\_records bigint, wal\_fpi bigint, wal\_bytes numeric, jit\_functions bigint, jit\_generation\_time double precision, jit\_inlining\_count bigint, jit\_inlining\_time double precision, jit\_optimization\_count bigint, jit\_optimization\_time double precision, jit\_emission\_count bigint, jit\_emission\_time double precision, jit\_deform\_count bigint, jit\_deform\_time double precision, stats\_since timestamp with time zone, minmax\_stats\_since timestamp with time zone",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "pg\_stat\_statements\_1\_11"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "pg\_stat\_statements\_info",

&nbsp;   "parameters": "dealloc bigint, stats\_reset timestamp with time zone",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "pg\_stat\_statements\_info"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "pg\_stat\_statements\_reset",

&nbsp;   "parameters": "userid oid, dbid oid, queryid bigint, minmax\_only boolean",

&nbsp;   "return\_type": "timestamp with time zone",

&nbsp;   "source\_code": "pg\_stat\_statements\_reset\_1\_11"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "pgrst\_ddl\_watch",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "pgrst\_drop\_watch",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "set\_graphql\_placeholder",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_generate\_v1",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_generate\_v1"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_generate\_v1mc",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_generate\_v1mc"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_generate\_v3",

&nbsp;   "parameters": "namespace uuid, name text",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_generate\_v3"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_generate\_v4",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_generate\_v4"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_generate\_v5",

&nbsp;   "parameters": "namespace uuid, name text",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_generate\_v5"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_nil",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_nil"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_ns\_dns",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_ns\_dns"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_ns\_oid",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_ns\_oid"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_ns\_url",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_ns\_url"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "extensions",

&nbsp;   "function\_name": "uuid\_ns\_x500",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "uuid\_ns\_x500"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "\_internal\_resolve",

&nbsp;   "parameters": "query text, variables jsonb, operationName text, extensions jsonb",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "comment\_directive",

&nbsp;   "parameters": "comment\_ text",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "exception",

&nbsp;   "parameters": "message text",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "get\_schema\_version",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "integer",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "increment\_schema\_version",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "event\_trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql",

&nbsp;   "function\_name": "resolve",

&nbsp;   "parameters": "query text, variables jsonb, operationName text, extensions jsonb",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "graphql\_public",

&nbsp;   "function\_name": "graphql",

&nbsp;   "parameters": "operationName text, query text, variables jsonb, extensions jsonb",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "\_await\_response",

&nbsp;   "parameters": "request\_id bigint",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "\_encode\_url\_with\_params\_array",

&nbsp;   "parameters": "url text, params\_array ARRAY",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "\_http\_collect\_response",

&nbsp;   "parameters": "request\_id bigint, async boolean",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "\_urlencode\_string",

&nbsp;   "parameters": "string character varying",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "check\_worker\_is\_up",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "http\_collect\_response",

&nbsp;   "parameters": "request\_id bigint, async boolean",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "http\_delete",

&nbsp;   "parameters": "url text, params jsonb, headers jsonb, timeout\_milliseconds integer",

&nbsp;   "return\_type": "bigint",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "http\_get",

&nbsp;   "parameters": "url text, params jsonb, headers jsonb, timeout\_milliseconds integer",

&nbsp;   "return\_type": "bigint",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "http\_post",

&nbsp;   "parameters": "url text, body jsonb, params jsonb, headers jsonb, timeout\_milliseconds integer",

&nbsp;   "return\_type": "bigint",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "net",

&nbsp;   "function\_name": "worker\_restart",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "pgbouncer",

&nbsp;   "function\_name": "get\_auth",

&nbsp;   "parameters": "p\_usename text, username text, password text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "private",

&nbsp;   "function\_name": "refresh\_and\_get\_gmail\_token",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_integration RECORD;\\n    v\_access\_token TEXT;\\n    v\_refresh\_token TEXT;\\n    v\_decrypted\_response JSONB;\\n    v\_refresh\_response JSONB;\\n    v\_supabase\_url TEXT;\\n    v\_service\_role\_key TEXT;\\n    v\_decrypt\_function\_url TEXT;\\n    v\_refresh\_function\_url TEXT;\\nBEGIN\\n    -- Obtener la integración de Gmail del superadmin\\n    SELECT \* INTO v\_integration\\n    FROM public.tenant\_integrations\\n    WHERE tenant\_id = '00000000-0000-0000-0000-000000000000'\\n      AND provider = 'google\_gmail'\\n    LIMIT 1;\\n\\n    IF NOT FOUND THEN\\n        RAISE EXCEPTION 'No se encontró la integración de google\_gmail para el superadmin.';\\n    END IF;\\n\\n    v\_access\_token := v\_integration.access\_token;\\n\\n    -- Lógica de Refresco de Token si es necesario\\n    IF v\_integration.expires\_at IS NULL OR v\_integration.expires\_at < now() THEN\\n        -- Obtener secretos necesarios\\n        SELECT decrypted\_secret INTO v\_supabase\_url FROM vault.decrypted\_secrets WHERE name = 'supabase\_url';\\n        SELECT decrypted\_secret INTO v\_service\_role\_key FROM vault.decrypted\_secrets WHERE name = 'supabase\_service\_role\_key';\\n        \\n        v\_decrypt\_function\_url := v\_supabase\_url || '/functions/v1/decrypt-secret';\\n        v\_refresh\_function\_url := v\_supabase\_url || '/functions/v1/refresh-google-token';\\n\\n        -- 1. Descifrar el refresh token llamando a la Edge Function segura\\n        SELECT content INTO v\_decrypted\_response FROM net.http\_post(\\n            url:= v\_decrypt\_function\_url,\\n            body:= jsonb\_build\_object(\\n                'encryptedData', v\_integration.encrypted\_credentials,\\n                'iv', v\_integration.nonce\\n            ),\\n            headers:= jsonb\_build\_object(\\n                'Content-Type', 'application/json',\\n                'Authorization', 'Bearer ' || v\_service\_role\_key\\n            )\\n        );\\n\\n        IF v\_decrypted\_response->>'decryptedText' IS NULL THEN\\n            RAISE EXCEPTION 'Error al descifrar el token desde Edge Function: %', (v\_decrypted\_response->>'error');\\n        END IF;\\n        v\_refresh\_token := v\_decrypted\_response->>'decryptedText';\\n\\n        -- 2. Invocar la Edge Function para obtener un nuevo token de acceso\\n        SELECT content INTO v\_refresh\_response FROM net.http\_post(\\n            url:= v\_refresh\_function\_url,\\n            body:= jsonb\_build\_object('refreshToken', v\_refresh\_token),\\n            headers:= jsonb\_build\_object(\\n                'Content-Type', 'application/json',\\n                'Authorization', 'Bearer ' || v\_service\_role\_key\\n            )\\n        );\\n        \\n        IF v\_refresh\_response->>'access\_token' IS NULL THEN\\n            RAISE EXCEPTION 'Error al refrescar token desde Edge Function: %', (v\_refresh\_response->>'error');\\n        END IF;\\n\\n        v\_access\_token := v\_refresh\_response->>'access\_token';\\n\\n        -- 3. Actualizar la tabla con el nuevo token y la nueva fecha de expiración\\n        UPDATE public.tenant\_integrations\\n        SET\\n            access\_token = v\_access\_token,\\n            expires\_at = now() + ((v\_refresh\_response->>'expires\_in')::INT \* interval '1 second')\\n        WHERE id = v\_integration.id;\\n    END IF;\\n\\n    RETURN v\_access\_token;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "private",

&nbsp;   "function\_name": "send\_email\_via\_gmail\_api",

&nbsp;   "parameters": "p\_recipient\_email text, p\_subject text, p\_body\_html text",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_integration RECORD;\\n    v\_access\_token TEXT;\\n    v\_refresh\_token TEXT;\\n    v\_encryption\_key TEXT;\\n    v\_google\_client\_id TEXT;\\n    v\_google\_client\_secret TEXT;\\n    v\_request\_id BIGINT;\\n    v\_response RECORD;\\n    v\_response\_body JSONB;\\n    v\_mime\_message TEXT;\\n    v\_base64\_mime TEXT;\\n    v\_request\_body JSONB;\\nBEGIN\\n    -- AUMENTAR EL TIMEOUT PARA ESTA TRANSACCIÓN\\n    SET statement\_timeout = '30s';\\n\\n    -- Obtener la integración de Gmail del superadmin\\n    SELECT \* INTO v\_integration\\n    FROM public.tenant\_integrations\\n    WHERE tenant\_id = '00000000-0000-0000-0000-000000000000'\\n      AND provider = 'google\_gmail'\\n    LIMIT 1;\\n\\n    IF NOT FOUND THEN\\n        RETURN jsonb\_build\_object('success', false, 'error', 'No se encontró la integración de google\_gmail para el superadmin.');\\n    END IF;\\n\\n    v\_access\_token := v\_integration.access\_token;\\n\\n    -- Lógica de Refresco de Token si es necesario\\n    IF v\_integration.expires\_at IS NULL OR v\_integration.expires\_at < now() THEN\\n        -- Obtener secretos\\n        SELECT decrypted\_secret INTO v\_google\_client\_id FROM vault.decrypted\_secrets WHERE name = 'google\_client\_id';\\n        SELECT decrypted\_secret INTO v\_google\_client\_secret FROM vault.decrypted\_secrets WHERE name = 'google\_client\_secret';\\n        SELECT decrypted\_secret INTO v\_encryption\_key FROM vault.decrypted\_secrets WHERE name = 'glamtica\_encryption\_key';\\n\\n        -- Desencriptar el refresh token\\n        v\_refresh\_token := pgp\_sym\_decrypt(v\_integration.encrypted\_refresh\_token, v\_encryption\_key);\\n\\n        -- Enviar la solicitud de refresco\\n        v\_request\_id := net.http\_post(\\n            url:= 'https://oauth2.googleapis.com/token',\\n            body:= jsonb\_build\_object(\\n                'client\_id', v\_google\_client\_id,\\n                'client\_secret', v\_google\_client\_secret,\\n                'refresh\_token', v\_refresh\_token,\\n                'grant\_type', 'refresh\_token'\\n            ),\\n            headers:= '{\\"Content-Type\\": \\"application/json\\"}'::jsonb\\n        );\\n\\n        -- Esperar y recoger la respuesta\\n        SELECT \* INTO v\_response FROM net.http\_collect\_response(v\_request\_id, async:=false);\\n        v\_response\_body := v\_response.body::jsonb;\\n\\n        IF v\_response.status\_code != 200 THEN\\n            RETURN jsonb\_build\_object('success', false, 'error', 'Error al refrescar token: ' || (v\_response\_body->>'error\_description'));\\n        END IF;\\n\\n        v\_access\_token := v\_response\_body->>'access\_token';\\n\\n        -- Actualizar la tabla con el nuevo token\\n        UPDATE public.tenant\_integrations\\n        SET\\n            access\_token = v\_access\_token,\\n            expires\_at = now() + ((v\_response\_body->>'expires\_in')::INT \* interval '1 second')\\n        WHERE id = v\_integration.id;\\n    END IF;\\n\\n    -- Construir y enviar el correo\\n    v\_mime\_message := 'From: ' || v\_integration.account\_email || E'\\\\r\\\\n' ||\\n                      'To: ' || p\_recipient\_email || E'\\\\r\\\\n' ||\\n                      'Subject: ' || p\_subject || E'\\\\r\\\\n' ||\\n                      'Content-Type: text/html; charset=UTF-8' || E'\\\\r\\\\n\\\\r\\\\n' ||\\n                      p\_body\_html;\\n\\n    v\_base64\_mime := encode(convert\_to(v\_mime\_message, 'UTF8'), 'base64');\\n    v\_request\_body := jsonb\_build\_object('raw', v\_base64\_mime);\\n\\n    v\_request\_id := net.http\_post(\\n        url:= 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',\\n        body:= v\_request\_body,\\n        headers:= jsonb\_build\_object(\\n            'Content-Type', 'application/json',\\n            'Authorization', 'Bearer ' || v\_access\_token\\n        )\\n    );\\n    \\n    SELECT \* INTO v\_response FROM net.http\_collect\_response(v\_request\_id, async:=false);\\n    v\_response\_body := v\_response.body::jsonb;\\n\\n    IF v\_response.status\_code = 200 AND v\_response\_body ? 'id' THEN\\n        RETURN jsonb\_build\_object('success', true);\\n    ELSE\\n        RETURN jsonb\_build\_object('success', false, 'error', 'Error en la API de Gmail: ' || (v\_response\_body->'error'->>'message'));\\n    END IF;\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RETURN jsonb\_build\_object('success', false, 'error', 'Excepción en send\_email\_via\_gmail\_api: ' || SQLERRM);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "activate\_branch",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_branch\_id uuid",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_branch RECORD;\\n    v\_subscription RECORD;\\n    v\_plan RECORD;\\n    v\_subscription\_status TEXT;\\n    v\_days\_in\_cycle INT;\\n    v\_days\_remaining INT;\\n    v\_daily\_rate NUMERIC;\\n    v\_prorated\_amount NUMERIC;\\nBEGIN\\n    -- Step 1: Verify the tenant has an active subscription\\n    SELECT status INTO v\_subscription\_status FROM public.get\_tenant\_subscription\_status(p\_tenant\_id);\\n    IF v\_subscription\_status != 'activo' THEN\\n        RAISE EXCEPTION 'Cannot activate branch. Tenant subscription status is: %', v\_subscription\_status;\\n    END IF;\\n\\n    -- Step 2: Validate the branch\\n    SELECT \* INTO v\_branch FROM public.branches WHERE id = p\_branch\_id AND tenant\_id = p\_tenant\_id;\\n    IF v\_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;\\n    IF v\_branch.status <> 'pending\_activation' THEN RAISE EXCEPTION 'Branch is not pending activation'; END IF;\\n\\n    -- Step 3: Get the latest subscription record\\n    SELECT \* INTO v\_subscription \\n    FROM public.tenant\_subscriptions \\n    WHERE tenant\_id = p\_tenant\_id \\n    ORDER BY end\_date DESC NULLS FIRST \\n    LIMIT 1;\\n    \\n    IF v\_subscription IS NULL THEN RAISE EXCEPTION 'No subscription record found to calculate proration'; END IF;\\n\\n    -- Step 4: Get plan details using the CORRECT column name\\n    SELECT \* INTO v\_plan FROM public.subscription\_plans WHERE id = v\_subscription.subscription\_plan\_id;\\n    IF v\_plan IS NULL OR v\_plan.branch\_price IS NULL OR v\_plan.branch\_price <= 0 THEN RAISE EXCEPTION 'Invalid plan or branch price is not set'; END IF;\\n\\n    -- Step 5: Proration Calculation with NULL end\_date handling\\n    IF v\_subscription.end\_date IS NULL THEN\\n        -- For permanent/demo subscriptions, we can define the proration as zero or a full charge.\\n        -- Let's consider it zero for now as it's a special case.\\n        v\_prorated\_amount := 0;\\n    ELSE\\n        v\_days\_in\_cycle := v\_subscription.end\_date::date - v\_subscription.start\_date::date;\\n        v\_days\_remaining := v\_subscription.end\_date::date - NOW()::date;\\n        v\_prorated\_amount := 0;\\n        IF v\_days\_remaining > 0 AND v\_days\_in\_cycle > 0 THEN\\n            v\_daily\_rate := v\_plan.branch\_price / v\_days\_in\_cycle;\\n            v\_prorated\_amount := v\_daily\_rate \* v\_days\_remaining;\\n        END IF;\\n    END IF;\\n\\n    -- Step 6: Activate the branch and create the asset\\n    UPDATE public.branches SET status = 'active', activated\_at = NOW() WHERE id = p\_branch\_id;\\n    INSERT INTO public.subscription\_assets (tenant\_subscription\_id, asset\_type, asset\_reference\_id, status, price\_at\_addition)\\n    VALUES (v\_subscription.id, 'branch', p\_branch\_id, 'active', v\_plan.branch\_price);\\n\\n    RETURN jsonb\_build\_object('success', true, 'prorated\_amount\_charged', round(v\_prorated\_amount, 2));\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "activate\_subscription",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_plan\_price\_id uuid, p\_payment\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_plan\_id UUID;\\n    v\_tenant\_country\_id UUID;\\n    v\_billing\_frequency\_months INT;\\n    v\_last\_subscription RECORD;\\n    v\_new\_start\_date TIMESTAMPTZ;\\n    v\_new\_end\_date TIMESTAMPTZ;\\n    v\_new\_subscription\_id UUID;\\n    v\_extra\_branch\_price NUMERIC;\\n    v\_branch\_record RECORD;\\n    v\_branch\_count INT;\\nBEGIN\\n    -- 1. Obtener datos del plan y del tenant\\n    SELECT subscription\_plan\_id INTO v\_plan\_id\\n    FROM public.plan\_price\_history\\n    WHERE id = p\_plan\_price\_id;\\n\\n    IF v\_plan\_id IS NULL THEN\\n        RAISE EXCEPTION 'No se encontró un plan para el plan\_price\_id: %', p\_plan\_price\_id;\\n    END IF;\\n\\n    -- 2. Calcular el nuevo periodo de suscripción\\n    SELECT \* INTO v\_last\_subscription\\n    FROM public.tenant\_subscriptions\\n    WHERE tenant\_id = p\_tenant\_id\\n    ORDER BY end\_date DESC\\n    LIMIT 1;\\n\\n    v\_new\_start\_date := v\_last\_subscription.end\_date;\\n    \\n    SELECT gcp.billing\_frequency\_months INTO v\_billing\_frequency\_months\\n    FROM public.get\_calculated\_plan\_prices() gcp\\n    WHERE gcp.plan\_id = v\_plan\_id\\n    LIMIT 1;\\n\\n    v\_new\_end\_date := v\_new\_start\_date + (v\_billing\_frequency\_months || ' months')::interval;\\n\\n    -- 3. Insertar el nuevo registro de suscripción y obtener su ID\\n    INSERT INTO public.tenant\_subscriptions (\\n        tenant\_id,\\n        subscription\_plan\_id,\\n        start\_date,\\n        end\_date,\\n        is\_trial\\n    )\\n    VALUES (\\n        p\_tenant\_id,\\n        v\_plan\_id,\\n        v\_new\_start\_date,\\n        v\_new\_end\_date,\\n        FALSE\\n    )\\n    RETURNING id INTO v\_new\_subscription\_id;\\n\\n    -- 4. Registrar las sucursales extra como items de la nueva suscripción\\n    -- Obtener el precio de la sucursal extra para el plan actual\\n    SELECT gcp.extra\_branch\_price INTO v\_extra\_branch\_price\\n    FROM public.get\_calculated\_plan\_prices() gcp\\n    WHERE gcp.plan\_id = v\_plan\_id\\n    LIMIT 1;\\n\\n    -- Contar las sucursales existentes\\n    SELECT count(\*) INTO v\_branch\_count\\n    FROM public.branches\\n    WHERE tenant\_id = p\_tenant\_id;\\n\\n    -- Si hay más de una sucursal (la primera es gratis), registrar las demás\\n    IF v\_branch\_count > 1 THEN\\n        FOR v\_branch\_record IN\\n            SELECT id FROM public.branches\\n            WHERE tenant\_id = p\_tenant\_id\\n            ORDER BY created\_at ASC\\n            OFFSET 1 -- Omitir la primera sucursal que es la gratuita\\n        LOOP\\n            INSERT INTO public.subscription\_items (\\n                subscription\_id,\\n                item\_type,\\n                item\_id,\\n                quantity,\\n                unit\_price\_at\_addition\\n            )\\n            VALUES (\\n                v\_new\_subscription\_id,\\n                'extra\_branch',\\n                v\_branch\_record.id,\\n                1,\\n                v\_extra\_branch\_price\\n            );\\n        END LOOP;\\n    END IF;\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "add\_tenant\_branch\_columns",

&nbsp;   "parameters": "table\_name text",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nBEGIN\\n    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant\_id UUID;', table\_name);\\n    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS branch\_id UUID;', table\_name);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "algorithm\_sign",

&nbsp;   "parameters": "signables text, secret text, algorithm text",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "archive\_branch",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_branch\_id uuid",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_branch record;\\n    v\_subscription record;\\nBEGIN\\n    SELECT \* INTO v\_branch FROM public.branches WHERE id = p\_branch\_id AND tenant\_id = p\_tenant\_id;\\n    IF v\_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;\\n    IF v\_branch.is\_main\_branch THEN RAISE EXCEPTION 'Cannot archive the main branch'; END IF;\\n    IF v\_branch.status <> 'active' THEN RAISE EXCEPTION 'Only active branches can be archived'; END IF;\\n    SELECT \* INTO v\_subscription FROM public.tenant\_subscriptions WHERE tenant\_id = p\_tenant\_id AND status = 'active' ORDER BY created\_at DESC LIMIT 1;\\n    IF v\_subscription IS NULL THEN RAISE EXCEPTION 'No active subscription found'; END IF;\\n    UPDATE public.branches SET status = 'archived' WHERE id = p\_branch\_id;\\n    UPDATE public.subscription\_assets SET status = 'cancelled', cancelled\_at = NOW()\\n    WHERE tenant\_subscription\_id = v\_subscription.id AND asset\_type = 'branch' AND asset\_reference\_id = p\_branch\_id AND status = 'active';\\n    RETURN jsonb\_build\_object('success', true, 'message', 'Branch archived');\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "armor",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "audit\_trigger\_function",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_old\_data jsonb;\\n    v\_new\_data jsonb;\\n    v\_object\_id uuid;\\n    v\_tenant\_id uuid;\\n    v\_branch\_id uuid;\\nBEGIN\\n    IF TG\_OP = 'INSERT' THEN\\n        v\_new\_data := to\_jsonb(NEW);\\n        v\_object\_id := NEW.id;\\n\\n        IF TG\_TABLE\_NAME = 'users' THEN\\n            v\_tenant\_id := NULL;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'tenants' THEN\\n            v\_tenant\_id := NEW.id;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'branches' THEN\\n            v\_tenant\_id := NEW.tenant\_id;\\n            v\_branch\_id := NEW.id;\\n        ELSE\\n            v\_tenant\_id := NEW.tenant\_id;\\n            v\_branch\_id := NEW.branch\_id;\\n        END IF;\\n\\n    ELSIF TG\_OP = 'UPDATE' THEN\\n        v\_old\_data := to\_jsonb(OLD);\\n        v\_new\_data := to\_jsonb(NEW);\\n        v\_object\_id := NEW.id;\\n\\n        IF TG\_TABLE\_NAME = 'users' THEN\\n            v\_tenant\_id := NULL;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'tenants' THEN\\n            v\_tenant\_id := NEW.id;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'branches' THEN\\n            v\_tenant\_id := NEW.tenant\_id;\\n            v\_branch\_id := NEW.id;\\n        ELSE\\n            v\_tenant\_id := NEW.tenant\_id;\\n            v\_branch\_id := NEW.branch\_id;\\n        END IF;\\n\\n    ELSIF TG\_OP = 'DELETE' THEN\\n        v\_old\_data := to\_jsonb(OLD);\\n        v\_object\_id := OLD.id;\\n\\n        IF TG\_TABLE\_NAME = 'users' THEN\\n            v\_tenant\_id := NULL;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'tenants' THEN\\n            v\_tenant\_id := OLD.id;\\n            v\_branch\_id := NULL;\\n        ELSIF TG\_TABLE\_NAME = 'branches' THEN\\n            v\_tenant\_id := OLD.tenant\_id;\\n            v\_branch\_id := OLD.id;\\n        ELSE\\n            v\_tenant\_id := OLD.tenant\_id;\\n            v\_branch\_id := OLD.branch\_id;\\n        END IF;\\n    END IF;\\n\\n    PERFORM public.log\_audit\_action(\\n        p\_action := TG\_OP || '\_' || TG\_TABLE\_NAME,\\n        p\_object\_type := TG\_TABLE\_NAME,\\n        p\_object\_id := v\_object\_id,\\n        p\_old\_value := v\_old\_data,\\n        p\_new\_value := v\_new\_data,\\n        p\_metadata := jsonb\_build\_object('trigger\_operation', TG\_OP),\\n        p\_tenant\_id := v\_tenant\_id,\\n        p\_branch\_id := v\_branch\_id\\n    );\\n\\n    RETURN NULL;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "bytea\_to\_text",

&nbsp;   "parameters": "data bytea",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "calculate\_purchase\_item\_total",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n  NEW.total\_cost = NEW.quantity \* NEW.unit\_cost;\\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "calculate\_service\_product\_total",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n  NEW.total\_price = NEW.quantity \* NEW.unit\_price;\\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "calculate\_session\_duration",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n  IF NEW.ended\_at IS NOT NULL AND NEW.started\_at IS NOT NULL THEN\\n    NEW.duration\_minutes := EXTRACT(EPOCH FROM (NEW.ended\_at - NEW.started\_at)) / 60;\\n  END IF;\\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "change\_password",

&nbsp;   "parameters": "p\_user\_id uuid, p\_current\_password text, p\_new\_password text, success boolean, message text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_user public.users;\\n    v\_password\_matches BOOLEAN;\\nBEGIN\\n    -- 1. Verificar que el usuario exista\\n    SELECT \* INTO v\_user\\n    FROM public.users u\\n    WHERE u.id = p\_user\_id;\\n\\n    IF v\_user IS NULL THEN\\n        RETURN QUERY SELECT FALSE, 'Usuario no encontrado.';\\n        RETURN;\\n    END IF;\\n\\n    -- 2. Verificar que la contraseña actual sea correcta\\n    SELECT u.password\_hash = crypt(p\_current\_password, u.password\_hash) INTO v\_password\_matches\\n    FROM public.users u WHERE u.id = p\_user\_id;\\n\\n    IF NOT v\_password\_matches THEN\\n        RETURN QUERY SELECT FALSE, 'La contraseña actual es incorrecta.';\\n        RETURN;\\n    END IF;\\n\\n    -- 3. Actualizar con la nueva contraseña\\n    UPDATE public.users\\n    SET password\_hash = crypt(p\_new\_password, gen\_salt('bf'))\\n    WHERE id = p\_user\_id;\\n\\n    -- 4. Devolver éxito\\n    RETURN QUERY SELECT TRUE, 'Contraseña actualizada exitosamente.';\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        -- Capturar cualquier otro error\\n        RETURN QUERY SELECT FALSE, 'Ocurrió un error inesperado al cambiar la contraseña.';\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "check\_stylist\_availability",

&nbsp;   "parameters": "p\_stylist\_id uuid, p\_appointment\_date date, p\_appointment\_time time without time zone, p\_duration\_minutes integer",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\nDECLARE\\n  v\_day\_of\_week integer;\\n  v\_schedule\_exists boolean;\\n  v\_schedule\_start time;\\n  v\_schedule\_end time;\\n  v\_appointment\_end\_time time;\\n  v\_time\_off\_exists boolean;\\nBEGIN\\n  -- Obtener día de la semana (0=Domingo, 6=Sábado)\\n  v\_day\_of\_week := EXTRACT(DOW FROM p\_appointment\_date);\\n  \\n  -- Calcular hora de finalización de la cita\\n  v\_appointment\_end\_time := p\_appointment\_time + (p\_duration\_minutes || ' minutes')::interval;\\n  \\n  -- Verificar si el estilista tiene horario para ese día\\n  SELECT \\n    EXISTS(SELECT 1 FROM stylist\_schedules \\n           WHERE stylist\_id = p\_stylist\_id \\n           AND day\_of\_week = v\_day\_of\_week \\n           AND is\_active = true),\\n    start\_time,\\n    end\_time\\n  INTO v\_schedule\_exists, v\_schedule\_start, v\_schedule\_end\\n  FROM stylist\_schedules \\n  WHERE stylist\_id = p\_stylist\_id \\n  AND day\_of\_week = v\_day\_of\_week \\n  AND is\_active = true;\\n  \\n  -- Si no tiene horario para ese día, no está disponible\\n  IF NOT v\_schedule\_exists THEN\\n    RETURN false;\\n  END IF;\\n  \\n  -- Verificar si la cita está dentro del horario de trabajo\\n  IF p\_appointment\_time < v\_schedule\_start OR v\_appointment\_end\_time > v\_schedule\_end THEN\\n    RETURN false;\\n  END IF;\\n  \\n  -- Verificar si tiene permisos aprobados para esa fecha/hora\\n  SELECT EXISTS(\\n    SELECT 1 FROM stylist\_time\_off \\n    WHERE stylist\_id = p\_stylist\_id \\n    AND status = 'approved'\\n    AND p\_appointment\_date >= start\_date \\n    AND p\_appointment\_date <= end\_date\\n    AND (\\n      -- Permiso de día completo\\n      (start\_time IS NULL AND end\_time IS NULL) OR\\n      -- Permiso parcial que se solapa con la cita\\n      (start\_time IS NOT NULL AND end\_time IS NOT NULL AND \\n       NOT (v\_appointment\_end\_time <= start\_time OR p\_appointment\_time >= end\_time))\\n    )\\n  ) INTO v\_time\_off\_exists;\\n  \\n  -- Si tiene permiso, no está disponible\\n  IF v\_time\_off\_exists THEN\\n    RETURN false;\\n  END IF;\\n  \\n  -- Si pasa todas las validaciones, está disponible\\n  RETURN true;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "check\_superadmin\_exists",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\nDECLARE\\n    superadmin\_exists BOOLEAN;\\nBEGIN\\n    -- La lógica ahora busca una asignación con el rol 'super\_admin'\\n    -- en la nueva tabla 'user\_assignments'.\\n    SELECT EXISTS (\\n        SELECT 1\\n        FROM public.user\_assignments ua\\n        JOIN public.roles r ON ua.role\_id = r.id\\n        WHERE r.name = 'super\_admin'\\n    ) INTO superadmin\_exists;\\n\\n    RETURN superadmin\_exists;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_application\_superadmin",

&nbsp;   "parameters": "admin\_email text, admin\_password text",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    super\_admin\_role\_id UUID;\\n    new\_user\_id UUID;\\nBEGIN\\n    -- Get the role\_id for 'super\_admin'\\n    SELECT id INTO super\_admin\_role\_id FROM public.roles WHERE name = 'super\_admin';\\n\\n    IF super\_admin\_role\_id IS NULL THEN\\n        RAISE EXCEPTION 'Role \\"super\_admin\\" not found.';\\n    END IF;\\n\\n    -- Insert the new application superadmin user\\n    INSERT INTO public.users (\\n        email,\\n        password\_hash,\\n        role\_id,\\n        is\_active\\n    )\\n    VALUES (\\n        admin\_email,\\n        crypt(admin\_password, gen\_salt('bf')),\\n        super\_admin\_role\_id,\\n        TRUE\\n    )\\n    RETURNING id INTO new\_user\_id;\\n\\n    RETURN new\_user\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_branch",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_name text, p\_address text",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_branch public.branches;\\nBEGIN\\n    INSERT INTO public.branches (tenant\_id, name, address, is\_main\_branch)\\n    VALUES (p\_tenant\_id, p\_name, p\_address, false)\\n    RETURNING \* INTO new\_branch;\\n    RETURN new\_branch;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_integration\_category",

&nbsp;   "parameters": "p\_name text, p\_slug text, p\_description text",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- La RLS de la tabla previene la inserción si el usuario no es superadmin.\\n    RETURN QUERY\\n    INSERT INTO integration\_categories (name, slug, description)\\n    VALUES (p\_name, p\_slug, p\_description)\\n    RETURNING \*;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_password\_reset\_token",

&nbsp;   "parameters": "p\_user\_id uuid, p\_requesting\_user\_role text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_token TEXT;\\nBEGIN\\n    -- Security Check\\n    IF p\_requesting\_user\_role != 'super\_admin' THEN\\n        RAISE EXCEPTION 'Access denied. Super admin role required.';\\n    END IF;\\n\\n    -- Generate a unique token\\n    new\_token := gen\_random\_uuid()::text;\\n\\n    -- Insert the new token into the table, with a 1-hour expiration\\n    INSERT INTO public.password\_reset\_tokens (user\_id, token, expires\_at)\\n    VALUES (p\_user\_id, new\_token, now() + interval '1 hour');\\n\\n    -- Return the token to the frontend\\n    RETURN json\_build\_object(\\n        'success', TRUE,\\n        'token', new\_token\\n    );\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_recovery\_link",

&nbsp;   "parameters": "p\_user\_email text, p\_user\_role text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n  response JSON;\\n  request\_id BIGINT;\\n  project\_url TEXT;\\n  service\_role\_key TEXT;\\nBEGIN\\n  RAISE NOTICE '\[create\_recovery\_link] Starting for email: %', p\_user\_email;\\n\\n  IF p\_user\_role != 'super\_admin' THEN\\n    RAISE EXCEPTION 'Access denied. Super admin role required.';\\n  END IF;\\n\\n  SELECT decrypted\_secret INTO project\_url FROM vault.decrypted\_secrets WHERE name = 'SUPABASE\_URL';\\n  SELECT decrypted\_secret INTO service\_role\_key FROM vault.decrypted\_secrets WHERE name = 'SUPABASE\_SERVICE\_ROLE\_KEY';\\n  RAISE NOTICE '\[create\_recovery\_link] Project URL from vault: %', project\_url;\\n  RAISE NOTICE '\[create\_recovery\_link] Service Role Key from vault (is null?): %', service\_role\_key IS NULL;\\n\\n  IF project\_url IS NULL OR service\_role\_key IS NULL THEN\\n      RAISE EXCEPTION 'URL or Service Role Key not configured in Vault.';\\n  END IF;\\n\\n  SELECT\\n      id\\n  INTO\\n      request\_id\\n  FROM\\n      net.http\_post(\\n          url := project\_url || '/auth/v1/admin/generate\_link',\\n          headers := jsonb\_build\_object(\\n              'apikey', service\_role\_key,\\n              'Authorization', 'Bearer ' || service\_role\_key,\\n              'Content-Type', 'application/json'\\n          ),\\n          body := jsonb\_build\_object(\\n              'type', 'recovery',\\n              'email', p\_user\_email\\n          )\\n      );\\n  RAISE NOTICE '\[create\_recovery\_link] HTTP request sent. Request ID: %', request\_id;\\n\\n  SELECT\\n      content::json\\n  INTO\\n      response\\n  FROM\\n      net.http\_collect\_response(request\_id, timeout\_milliseconds := 2000);\\n  RAISE NOTICE '\[create\_recovery\_link] HTTP response received: %', response;\\n\\n  RETURN json\_build\_object('recoveryLink', response -> 'action\_link');\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_signed\_avatar\_upload\_url",

&nbsp;   "parameters": "p\_file\_path text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    signed\_url TEXT;\\nBEGIN\\n    -- Generate a signed URL that is valid for 5 minutes.\\n    -- The URL allows uploading a file with the specified path.\\n    SELECT storage.sign\_upload\_url('avatars', p\_file\_path, 300) INTO signed\_url;\\n\\n    RETURN json\_build\_object('success', TRUE, 'signedUrl', signed\_url);\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'Failed to create signed upload URL: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant",

&nbsp;   "parameters": "tenant\_name text, tenant\_contact\_person text, tenant\_contact\_email text, tenant\_contact\_phone text, tenant\_address text, tenant\_city text, tenant\_country\_id uuid, tenant\_logo\_url text, tenant\_notes text, admin\_email text, admin\_password text, admin\_language\_code text, admin\_currency\_id uuid, admin\_timezone text",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_tenant\_id UUID;\\n    tenant\_super\_admin\_role\_id UUID;\\n    new\_branch\_id UUID;\\nBEGIN\\n    -- Get the role\_id for 'tenant\_super\_admin'\\n    SELECT id INTO tenant\_super\_admin\_role\_id FROM public.roles WHERE name = 'tenant\_super\_admin';\\n\\n    IF tenant\_super\_admin\_role\_id IS NULL THEN\\n        RAISE EXCEPTION 'Role \\"tenant\_super\_admin\\" not found.';\\n    END IF;\\n\\n    -- Insert new tenant\\n    INSERT INTO public.tenants (\\n        name,\\n        contact\_person,\\n        contact\_email,\\n        contact\_phone,\\n        address,\\n        city,\\n        country\_id,\\n        logo\_url,\\n        notes,\\n        default\_language\_code,\\n        default\_currency\_id,\\n        default\_timezone\\n    )\\n    VALUES (\\n        tenant\_name,\\n        tenant\_contact\_person,\\n        tenant\_contact\_email,\\n        tenant\_contact\_phone,\\n        tenant\_address,\\n        tenant\_city,\\n        tenant\_country\_id,\\n        tenant\_logo\_url,\\n        tenant\_notes,\\n        admin\_language\_code,\\n        admin\_currency\_id,\\n        admin\_timezone\\n    )\\n    RETURNING id INTO new\_tenant\_id;\\n\\n    -- Create a default branch for the new tenant\\n    INSERT INTO public.branches (\\n        tenant\_id,\\n        name,\\n        address,\\n        language\_code,\\n        currency\_id,\\n        timezone\\n    )\\n    VALUES (\\n        new\_tenant\_id,\\n        'Sede Principal', -- Default branch name\\n        tenant\_address,\\n        admin\_language\_code,\\n        admin\_currency\_id,\\n        admin\_timezone\\n    )\\n    RETURNING id INTO new\_branch\_id;\\n\\n    -- Create the tenant\_super\_admin user\\n    INSERT INTO public.users (\\n        email,\\n        password\_hash,\\n        role\_id,\\n        tenant\_id,\\n        branch\_id,\\n        language\_code,\\n        currency\_id,\\n        timezone,\\n        is\_active\\n    )\\n    VALUES (\\n        admin\_email,\\n        crypt(admin\_password, gen\_salt('bf')), -- Hash the password\\n        tenant\_super\_admin\_role\_id,\\n        new\_tenant\_id,\\n        new\_branch\_id,\\n        admin\_language\_code,\\n        admin\_currency\_id,\\n        admin\_timezone,\\n        TRUE\\n    );\\n\\n    RETURN new\_tenant\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant\_admin",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_email text, p\_password text",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n  v\_role\_id uuid;\\n  v\_user\_id uuid;\\n  v\_hashed\_password text;\\nBEGIN\\n  -- Verificar si el usuario actual es super\_admin (sin cambios)\\n  IF NOT (SELECT public.is\_super\_admin()) THEN\\n    RAISE EXCEPTION 'Acceso denado. Solo los superadministradores pueden crear administradores de tenant.';\\n  END IF;\\n\\n  -- Obtener el ID del rol 'tenant\_super\_admin' (sin cambios)\\n  SELECT id INTO v\_role\_id FROM public.roles WHERE name = 'tenant\_super\_admin';\\n  IF v\_role\_id IS NULL THEN\\n    RAISE EXCEPTION 'Rol tenant\_super\_admin no encontrado.';\\n  END IF;\\n\\n  -- Hashear la contraseña (sin cambios)\\n  SELECT public.crypt(p\_password, public.gen\_salt('bf')) INTO v\_hashed\_password;\\n\\n  -- Insertar el nuevo usuario (REFACTORIZADO)\\n  -- Se inserta solo la identidad en 'users'.\\n  INSERT INTO public.users (email, password\_hash)\\n  VALUES (p\_email, v\_hashed\_password)\\n  RETURNING id INTO v\_user\_id;\\n\\n  -- Crear la asignación en la nueva tabla (NUEVO)\\n  INSERT INTO public.user\_assignments (user\_id, tenant\_id, role\_id)\\n  VALUES (v\_user\_id, p\_tenant\_id, v\_role\_id);\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant\_and\_admin\_logic",

&nbsp;   "parameters": "p\_business\_name text, p\_country\_id uuid, p\_default\_language\_code text, p\_default\_currency\_id uuid, p\_default\_timezone text, p\_contact\_phone text, p\_whatsapp\_phone text, p\_commercial\_email text, p\_legal\_name text, p\_tax\_id text, p\_billing\_address text, p\_einvoicing\_email text, p\_physical\_address\_line1 text, p\_physical\_address\_line2 text, p\_physical\_city text, p\_physical\_state text, p\_physical\_postal\_code text, p\_website text, p\_latitude numeric, p\_longitude numeric, p\_admin\_email text, p\_admin\_password text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_tenant\_id UUID;\\n    new\_user\_id UUID;\\n    new\_branch\_id UUID;\\nBEGIN\\n    -- 1. Crear el Tenant\\n    INSERT INTO tenants (\\n        name, country\_id, default\_language\_code, default\_currency\_id, default\_timezone,\\n        contact\_phone, whatsapp\_phone, commercial\_email, legal\_name, tax\_id,\\n        billing\_address, einvoicing\_email, physical\_address\_line1, physical\_address\_line2,\\n        physical\_city, physical\_state, physical\_postal\_code, website, latitude, longitude,\\n        subscription\_status\\n    ) VALUES (\\n        p\_business\_name, p\_country\_id, p\_default\_language\_code, p\_default\_currency\_id, p\_default\_timezone,\\n        p\_contact\_phone, p\_whatsapp\_phone, p\_commercial\_email, p\_legal\_name, p\_tax\_id,\\n        p\_billing\_address, p\_einvoicing\_email, p\_physical\_address\_line1, p\_physical\_address\_line2,\\n        p\_physical\_city, p\_physical\_state, p\_physical\_postal\_code, p\_website, p\_latitude, p\_longitude,\\n        'trial' -- Todos los registros nuevos comienzan en 'trial'\\n    ) RETURNING id INTO new\_tenant\_id;\\n\\n    -- 2. Crear el usuario administrador\\n    -- Usamos `auth.admin\_create\_user` que está disponible en el contexto de SECURITY DEFINER\\n    new\_user\_id := auth.admin\_create\_user(\\n        p\_admin\_email,\\n        p\_admin\_password,\\n        '{\\"raw\_user\_meta\_data\\": {\\"is\_superadmin\\": false}}'::jsonb\\n    );\\n\\n    -- 3. Vincular el usuario al tenant\\n    INSERT INTO tenant\_users (tenant\_id, user\_id, role)\\n    VALUES (new\_tenant\_id, new\_user\_id, 'admin');\\n\\n    -- 4. Crear la sucursal principal\\n    INSERT INTO branches (tenant\_id, name, is\_main\_branch, address\_line\_1, city, state, postal\_code, country\_id)\\n    VALUES (new\_tenant\_id, 'Sucursal Principal', true, p\_physical\_address\_line1, p\_physical\_city, p\_physical\_state, p\_physical\_postal\_code, p\_country\_id)\\n    RETURNING id INTO new\_branch\_id;\\n\\n    -- 5. Devolver un resultado exitoso\\n    RETURN json\_build\_object(\\n        'success', true,\\n        'tenant\_id', new\_tenant\_id,\\n        'user\_id', new\_user\_id,\\n        'branch\_id', new\_branch\_id\\n    );\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        -- En caso de cualquier error, devolver un JSON con el mensaje de error\\n        RETURN json\_build\_object('success', false, 'message', SQLERRM);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant\_user",

&nbsp;   "parameters": "p\_email text, p\_password text, p\_role\_id uuid, p\_tenant\_id uuid, p\_branch\_id uuid",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_user\_id UUID;\\nBEGIN\\n    -- La seguridad debe ser manejada por políticas de RLS en el frontend\\n    -- o en una función de nivel superior. Esta función se centra en la creación.\\n\\n    -- Insertar en public.users (REFACTORIZADO)\\n    INSERT INTO public.users (email, password\_hash, is\_active)\\n    VALUES (\\n        p\_email,\\n        public.crypt(p\_password, public.gen\_salt('bf')),\\n        TRUE\\n    )\\n    RETURNING id INTO new\_user\_id;\\n\\n    -- Crear la asignación en la nueva tabla (NUEVO)\\n    INSERT INTO public.user\_assignments (user\_id, tenant\_id, role\_id, branch\_id)\\n    VALUES (new\_user\_id, p\_tenant\_id, p\_role\_id, p\_branch\_id);\\n\\n    -- Devolver un mensaje de éxito\\n    RETURN json\_build\_object(\\n        'success', TRUE,\\n        'message', 'User created successfully.',\\n        'userId', new\_user\_id\\n    );\\n\\nEXCEPTION\\n    WHEN unique\_violation THEN\\n        RAISE EXCEPTION 'User with this email already exists.';\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant\_with\_admin",

&nbsp;   "parameters": "name text, subscription\_status USER-DEFINED, country\_id uuid, default\_language\_code text, default\_currency\_id uuid, default\_timezone text, contact\_phone text, whatsapp\_phone text, commercial\_email text, legal\_name text, tax\_id text, billing\_address text, einvoicing\_email text, physical\_address\_line1 text, physical\_address\_line2 text, physical\_city text, physical\_state text, physical\_postal\_code text, website text, latitude double precision, longitude double precision, admin\_email text, admin\_password text, created\_tenant\_id uuid",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_tenant\_id UUID;\\n    new\_branch\_id UUID;\\n    tenant\_admin\_role\_id UUID;\\n    new\_user\_id UUID;\\n    v\_trial\_duration\_days INT;\\nBEGIN\\n    -- 1. Create the new tenant, forcing 'trial' status\\n    INSERT INTO public.tenants (\\n        name, subscription\_status, country\_id, default\_language\_code, default\_currency\_id, default\_timezone,\\n        contact\_phone, whatsapp\_phone, commercial\_email, legal\_name, tax\_id, billing\_address, einvoicing\_email,\\n        physical\_address\_line1, physical\_address\_line2, physical\_city, physical\_state, physical\_postal\_code,\\n        website, latitude, longitude\\n    ) VALUES (\\n        create\_tenant\_with\_admin.name, 'trial', create\_tenant\_with\_admin.country\_id,\\n        create\_tenant\_with\_admin.default\_language\_code, create\_tenant\_with\_admin.default\_currency\_id, create\_tenant\_with\_admin.default\_timezone,\\n        create\_tenant\_with\_admin.contact\_phone, create\_tenant\_with\_admin.whatsapp\_phone, create\_tenant\_with\_admin.commercial\_email,\\n        create\_tenant\_with\_admin.legal\_name, create\_tenant\_with\_admin.tax\_id, create\_tenant\_with\_admin.billing\_address,\\n        create\_tenant\_with\_admin.einvoicing\_email, create\_tenant\_with\_admin.physical\_address\_line1,\\n        create\_tenant\_with\_admin.physical\_address\_line2, create\_tenant\_with\_admin.physical\_city,\\n        create\_tenant\_with\_admin.physical\_state, create\_tenant\_with\_admin.physical\_postal\_code,\\n        create\_tenant\_with\_admin.website, create\_tenant\_with\_admin.latitude, create\_tenant\_with\_admin.longitude\\n    ) RETURNING id INTO new\_tenant\_id;\\n\\n    -- 2. Create the trial subscription\\n    -- Get trial duration from global settings, with a fallback\\n    SELECT gs.trial\_duration\_days INTO v\_trial\_duration\_days FROM public.global\_settings gs LIMIT 1;\\n    IF v\_trial\_duration\_days IS NULL THEN\\n        v\_trial\_duration\_days := 14;\\n    END IF;\\n\\n    -- Insert the trial record into tenant\_subscriptions\\n    INSERT INTO public.tenant\_subscriptions (tenant\_id, is\_trial, start\_date, end\_date, is\_active)\\n    VALUES (new\_tenant\_id, true, now(), now() + (v\_trial\_duration\_days || ' days')::interval, true);\\n\\n    -- 3. Create the default \\"Principal\\" branch for the new tenant\\n    INSERT INTO public.branches (tenant\_id, name, is\_main\_branch)\\n    VALUES (new\_tenant\_id, 'Principal', TRUE)\\n    RETURNING id INTO new\_branch\_id;\\n\\n    -- 4. Get the 'tenant\_super\_admin' role ID\\n    SELECT id INTO tenant\_admin\_role\_id FROM public.roles WHERE roles.name = 'tenant\_super\_admin' LIMIT 1;\\n    IF tenant\_admin\_role\_id IS NULL THEN\\n        RAISE EXCEPTION 'El rol \\"tenant\_super\_admin\\" no fue encontrado.';\\n    END IF;\\n\\n    -- 5. Create the new admin user\\n    INSERT INTO public.users (email, password\_hash, tenant\_id, role\_id)\\n    VALUES (\\n        create\_tenant\_with\_admin.admin\_email,\\n        crypt(create\_tenant\_with\_admin.admin\_password, gen\_salt('bf')),\\n        new\_tenant\_id,\\n        tenant\_admin\_role\_id\\n    ) RETURNING id INTO new\_user\_id;\\n\\n    -- 6. Populate default template settings for the new tenant\\n    INSERT INTO public.tenant\_template\_settings (tenant\_id, template\_type, is\_active)\\n    SELECT\\n        new\_tenant\_id,\\n        template\_type,\\n        true\\n    FROM public.email\_templates\\n    WHERE\\n        propagate\_to\_new\_tenants = true\\n        AND tenant\_id = '00000000-0000-0000-0000-000000000000'\\n    GROUP BY template\_type;\\n\\n    -- 7. Return the ID of the created tenant\\n    RETURN QUERY SELECT new\_tenant\_id;\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "create\_tenant\_with\_admin",

&nbsp;   "parameters": "name text, subscription\_status text, country\_id uuid, default\_language\_code text, default\_currency\_id uuid, default\_timezone text, contact\_phone text, whatsapp\_phone text, commercial\_email text, legal\_name text, tax\_id text, billing\_address text, einvoicing\_email text, physical\_address\_line1 text, physical\_address\_line2 text, physical\_city text, physical\_state text, physical\_postal\_code text, website text, latitude numeric, longitude numeric, admin\_email text, admin\_password text, created\_tenant\_id uuid",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    new\_tenant\_id UUID;\\n    tenant\_admin\_role\_id UUID;\\n    new\_user\_id UUID;\\nBEGIN\\n    -- Paso 1: Crear el nuevo tenant (sin cambios)\\n    INSERT INTO tenants (\\n        name, subscription\_status, country\_id, default\_language\_code, default\_currency\_id, default\_timezone,\\n        contact\_phone, whatsapp\_phone, commercial\_email, legal\_name, tax\_id, billing\_address, einvoicing\_email,\\n        physical\_address\_line1, physical\_address\_line2, physical\_city, physical\_state, physical\_postal\_code,\\n        website, latitude, longitude\\n    ) VALUES (\\n        create\_tenant\_with\_admin.name, create\_tenant\_with\_admin.subscription\_status, create\_tenant\_with\_admin.country\_id,\\n        create\_tenant\_with\_admin.default\_language\_code, create\_tenant\_with\_admin.default\_currency\_id, create\_tenant\_with\_admin.default\_timezone,\\n        create\_tenant\_with\_admin.contact\_phone, create\_tenant\_with\_admin.whatsapp\_phone, create\_tenant\_with\_admin.commercial\_email,\\n        create\_tenant\_with\_admin.legal\_name, create\_tenant\_with\_admin.tax\_id, create\_tenant\_with\_admin.billing\_address,\\n        create\_tenant\_with\_admin.einvoicing\_email, create\_tenant\_with\_admin.physical\_address\_line1,\\n        create\_tenant\_with\_admin.physical\_address\_line2, create\_tenant\_with\_admin.physical\_city,\\n        create\_tenant\_with\_admin.physical\_state, create\_tenant\_with\_admin.physical\_postal\_code,\\n        create\_tenant\_with\_admin.website, create\_tenant\_with\_admin.latitude, create\_tenant\_with\_admin.longitude\\n    ) RETURNING id INTO new\_tenant\_id;\\n\\n    -- Paso 2: Obtener el ID del rol 'tenant\_super\_admin' (sin cambios)\\n    SELECT id INTO tenant\_admin\_role\_id FROM roles WHERE roles.name = 'tenant\_super\_admin' LIMIT 1;\\n    IF tenant\_admin\_role\_id IS NULL THEN\\n        RAISE EXCEPTION 'El rol \\"tenant\_super\_admin\\" no fue encontrado.';\\n    END IF;\\n\\n    -- Paso 3: Crear el nuevo usuario (REFACTORIZADO)\\n    -- Se inserta solo la información de identidad en la tabla 'users'.\\n    INSERT INTO users (email, password\_hash)\\n    VALUES (\\n        create\_tenant\_with\_admin.admin\_email,\\n        crypt(create\_tenant\_with\_admin.admin\_password, gen\_salt('bf'))\\n    ) RETURNING id INTO new\_user\_id;\\n\\n    -- Paso 4: Crear la asignación en la nueva tabla (NUEVO)\\n    -- Se vincula el usuario, el tenant y el rol en 'user\_assignments'.\\n    INSERT INTO user\_assignments (user\_id, tenant\_id, role\_id)\\n    VALUES (new\_user\_id, new\_tenant\_id, tenant\_admin\_role\_id);\\n\\n    -- Paso 5: Devolver el ID del tenant creado (sin cambios)\\n    RETURN QUERY SELECT new\_tenant\_id;\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "crypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "dearmor",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "decrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "decrypt\_iv",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "delete\_branch",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_branch\_id uuid",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_branch record;\\nBEGIN\\n    SELECT \* INTO v\_branch FROM public.branches WHERE id = p\_branch\_id AND tenant\_id = p\_tenant\_id;\\n    IF v\_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;\\n    IF v\_branch.is\_main\_branch THEN RAISE EXCEPTION 'Cannot delete the main branch'; END IF;\\n    DELETE FROM public.branches WHERE id = p\_branch\_id;\\n    RETURN jsonb\_build\_object('success', true, 'message', 'Branch deleted successfully');\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "delete\_integration\_category",

&nbsp;   "parameters": "p\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- Primero, se comprueba que la categoría no esté en uso.\\n    IF EXISTS (SELECT 1 FROM integration\_providers WHERE category\_id = p\_id) THEN\\n        RAISE EXCEPTION 'No se puede eliminar la categoría porque está siendo utilizada por uno o más proveedores.';\\n    END IF;\\n\\n    -- La RLS de la tabla previene la eliminación si el usuario no es superadmin.\\n    DELETE FROM integration\_categories WHERE id = p\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "delete\_tenant\_cascade",

&nbsp;   "parameters": "target\_tenant\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nBEGIN\\n    RAISE LOG 'Iniciando borrado en cascada (v3) para el tenant: %', target\_tenant\_id;\\n\\n    -- Nivel 1: Datos de eventos y logs\\n    RAISE LOG 'Borrando audit\_logs...';\\n    DELETE FROM audit\_logs WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando appointment\_evidence...';\\n    DELETE FROM appointment\_evidence WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando appointment\_extra\_services...';\\n    DELETE FROM appointment\_extra\_services WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando appointment\_products...';\\n    DELETE FROM appointment\_products WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando appointment\_sessions...';\\n    DELETE FROM appointment\_sessions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando attention\_products...';\\n    DELETE FROM attention\_products WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando attention\_service\_products...';\\n    DELETE FROM attention\_service\_products WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando attention\_services...';\\n    DELETE FROM attention\_services WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando extra\_service\_sessions...';\\n    DELETE FROM extra\_service\_sessions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando service\_evidence...';\\n    DELETE FROM service\_evidence WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando service\_sessions...';\\n    DELETE FROM service\_sessions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando product\_stylist\_commissions...';\\n    DELETE FROM product\_stylist\_commissions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando service\_stylist\_commissions...';\\n    DELETE FROM service\_stylist\_commissions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando purchase\_items...';\\n    DELETE FROM purchase\_items WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando stylist\_time\_off...';\\n    DELETE FROM stylist\_time\_off WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando user\_permissions...';\\n    DELETE FROM user\_permissions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando menu\_permissions...';\\n    DELETE FROM menu\_permissions WHERE tenant\_id = target\_tenant\_id;\\n\\n    -- Nivel 2: Entidades transaccionales principales\\n    RAISE LOG 'Borrando appointments...';\\n    DELETE FROM appointments WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando attentions...';\\n    DELETE FROM attentions WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando purchases...';\\n    DELETE FROM purchases WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando stylist\_schedules...';\\n    DELETE FROM stylist\_schedules WHERE tenant\_id = target\_tenant\_id;\\n\\n    -- Nivel 3: Usuarios y sus datos asociados (CRÍTICO: antes de roles y branches)\\n    RAISE LOG 'Borrando users...';\\n    DELETE FROM users WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando stylists...';\\n    DELETE FROM stylists WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando clients...';\\n    DELETE FROM clients WHERE tenant\_id = target\_tenant\_id;\\n\\n    -- Nivel 4: Catálogos y datos de negocio base\\n    RAISE LOG 'Borrando supplier\_products...';\\n    DELETE FROM supplier\_products WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando suppliers...';\\n    DELETE FROM suppliers WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando products...';\\n    DELETE FROM products WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando services...';\\n    DELETE FROM services WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando service\_categories...';\\n    DELETE FROM service\_categories WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando brands...';\\n    DELETE FROM brands WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando schedule\_templates...';\\n    DELETE FROM schedule\_templates WHERE tenant\_id = target\_tenant\_id;\\n\\n    -- Nivel 5: Configuración del Tenant\\n    RAISE LOG 'Borrando branches...';\\n    DELETE FROM branches WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando translations...';\\n    DELETE FROM translations WHERE tenant\_id = target\_tenant\_id;\\n    RAISE LOG 'Borrando tenant\_subscriptions...';\\n    DELETE FROM tenant\_subscriptions WHERE tenant\_id = target\_tenant\_id;\\n\\n    -- Nivel Final: El tenant mismo\\n    RAISE LOG 'Borrando el tenant principal...';\\n    DELETE FROM tenants WHERE id = target\_tenant\_id;\\n\\n    RAISE LOG 'Borrado en cascada (v3) completado para el tenant: %', target\_tenant\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "delete\_tenant\_integration",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_provider text, p\_requesting\_user\_role text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    integration\_record RECORD;\\n    rows\_deleted INT;\\nBEGIN\\n    -- Security Check\\n    IF p\_requesting\_user\_role != 'super\_admin' THEN\\n        RAISE EXCEPTION 'Access denied. Super admin role required.';\\n    END IF;\\n\\n    -- Get the integration record for the SPECIFIC tenant\\n    SELECT \* INTO integration\_record\\n    FROM public.tenant\_integrations\\n    WHERE\\n        tenant\_id = p\_tenant\_id -- <-- THE CRITICAL FIX\\n    AND \\n        (provider = p\_provider OR (p\_provider = 'google' AND provider = 'google\_drive'));\\n\\n    -- If no record is found for this tenant, exit gracefully\\n    IF integration\_record IS NULL THEN\\n        RETURN json\_build\_object('success', true, 'message', 'No integration found for this tenant to delete.');\\n    END IF;\\n\\n    -- (The token revocation logic can be added back here later if needed)\\n\\n    -- Delete the local integration record using its specific ID\\n    WITH deleted\_rows AS (\\n        DELETE FROM public.tenant\_integrations\\n        WHERE id = integration\_record.id\\n        RETURNING 1\\n    )\\n    SELECT count(\*) INTO rows\_deleted FROM deleted\_rows;\\n\\n    -- Return a success message\\n    RETURN json\_build\_object('success', TRUE, 'message', 'Integración eliminada correctamente.', 'rows\_deleted', rows\_deleted);\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'An unexpected error occurred during integration deletion: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "digest",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "disconnect\_google\_provider",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_provider text, p\_requesting\_user\_id uuid",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- Primero, verificamos si el usuario autenticado es un superadministrador.\\n    -- Esta es una capa de seguridad crucial.\\n    IF NOT EXISTS (\\n        SELECT 1\\n        FROM public.users u\\n        JOIN public.roles r ON u.role\_id = r.id\\n        WHERE u.id = p\_requesting\_user\_id AND r.name = 'super\_admin'\\n    ) THEN\\n        RETURN json\_build\_object('success', false, 'message', 'Acceso no autorizado. Se requiere ser superadministrador.');\\n    END IF;\\n\\n    -- Procedemos a eliminar la integración específica para el tenant dado.\\n    DELETE FROM public.tenant\_integrations\\n    WHERE tenant\_id = p\_tenant\_id AND provider = p\_provider;\\n\\n    -- La variable 'FOUND' en PL/pgSQL es verdadera si la última operación (DELETE) afectó al menos una fila.\\n    IF FOUND THEN\\n        RETURN json\_build\_object('success', true, 'message', 'Integración desconectada correctamente.');\\n    ELSE\\n        -- Si no se encontró ninguna fila para eliminar, informamos que no existía.\\n        RETURN json\_build\_object('success', false, 'message', 'No se encontró una integración activa de este tipo para el tenant especificado.');\\n    END IF;\\n\\nEXCEPTION\\n    -- Capturamos cualquier otro error que pueda ocurrir durante la ejecución.\\n    WHEN OTHERS THEN\\n        RETURN json\_build\_object('success', false, 'message', 'Ocurrió un error interno al intentar desconectar la integración.');\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "encrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "encrypt\_iv",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "enqueue\_test\_email",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_super\_admin\_user\_id UUID;\\n    v\_new\_job public.email\_queue;\\nBEGIN\\n    -- 1. Encontrar al super\_admin del sistema usando la tabla de asignaciones\\n    SELECT ua.user\_id INTO v\_super\_admin\_user\_id\\n    FROM public.user\_assignments ua\\n    JOIN public.roles r ON ua.role\_id = r.id\\n    WHERE r.name = 'super\_admin'\\n    LIMIT 1;\\n\\n    IF NOT FOUND THEN\\n        RETURN jsonb\_build\_object('success', false, 'message', 'No se encontró al usuario super\_admin del sistema.');\\n    END IF;\\n\\n    -- 2. Insertar el trabajo en la cola y devolverlo\\n    INSERT INTO public.email\_queue (recipient\_user\_id, template\_type, template\_data)\\n    VALUES (\\n        v\_super\_admin\_user\_id,\\n        'WELCOME\_USER',\\n        jsonb\_build\_object('user\_name', 'Super Admin (Prueba de Cola)')\\n    ) RETURNING \* INTO v\_new\_job;\\n\\n    RETURN jsonb\_build\_object('success', true, 'job', row\_to\_json(v\_new\_job));\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RETURN jsonb\_build\_object('success', false, 'message', 'Error inesperado al encolar: ' || SQLERRM);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "gen\_random\_bytes",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "gen\_random\_uuid",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "gen\_salt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "generate\_invoice\_for\_subscription",

&nbsp;   "parameters": "p\_subscription\_id uuid",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_tenant\_id UUID;\\n    v\_branch\_id UUID;\\n    v\_plan\_id UUID;\\n    v\_country\_id UUID;\\n    v\_currency\_id UUID;\\n    v\_invoice\_id UUID;\\n    v\_invoice\_item\_id UUID;\\n    v\_calculated\_price NUMERIC;\\n    v\_calculated\_extra\_branch\_price NUMERIC;\\n    v\_plan\_name TEXT;\\n    v\_description TEXT;\\n    v\_subtotal NUMERIC := 0;\\n    v\_total\_taxes NUMERIC := 0;\\n    v\_tax\_record RECORD;\\nBEGIN\\n    -- 1. Obtener datos de la suscripción y del tenant\\n    SELECT\\n        ts.tenant\_id, ts.branch\_id, ts.subscription\_plan\_id, t.country\_id, t.default\_currency\_id\\n    INTO\\n        v\_tenant\_id, v\_branch\_id, v\_plan\_id, v\_country\_id, v\_currency\_id\\n    FROM public.tenant\_subscriptions ts\\n    JOIN public.tenants t ON ts.tenant\_id = t.id\\n    WHERE ts.id = p\_subscription\_id;\\n\\n    IF v\_tenant\_id IS NULL THEN\\n        RAISE EXCEPTION 'Suscripción con ID % no encontrada.', p\_subscription\_id;\\n    END IF;\\n\\n    -- 2. Obtener el precio calculado para el plan y país específicos\\n    -- Reutilizamos la lógica de la función get\_calculated\_plan\_prices\\n    SELECT\\n        gcp.plan\_name,\\n        gcp.calculated\_price,\\n        gcp.calculated\_extra\_branch\_price\\n    INTO\\n        v\_plan\_name,\\n        v\_calculated\_price,\\n        v\_calculated\_extra\_branch\_price\\n    FROM public.get\_calculated\_plan\_prices() gcp\\n    WHERE gcp.plan\_id = v\_plan\_id AND gcp.country\_id = v\_country\_id\\n    LIMIT 1;\\n\\n    IF v\_calculated\_price IS NULL THEN\\n        RAISE EXCEPTION 'No se pudo calcular el precio para el plan ID % y país ID %.', v\_plan\_id, v\_country\_id;\\n    END IF;\\n\\n    -- 3. Crear la cabecera de la factura (con totales iniciales en 0)\\n    INSERT INTO public.invoices (\\n        tenant\_id, billed\_to\_tenant\_id, issue\_date, due\_date,\\n        subtotal\_amount, total\_tax\_amount, total\_amount, currency\_id,\\n        invoice\_number, status\\n    ) VALUES (\\n        '00000000-0000-0000-0000-000000000000', -- Factura emitida por el superadmin\\n        v\_tenant\_id,\\n        CURRENT\_DATE,\\n        CURRENT\_DATE + INTERVAL '1 month',\\n        0, 0, 0,\\n        v\_currency\_id,\\n        'INV-' || to\_char(CURRENT\_DATE, 'YYYYMMDD') || '-' || (SELECT count(\*) + 1 FROM invoices),\\n        'draft'\\n    ) RETURNING id INTO v\_invoice\_id;\\n\\n    -- 4. Crear el item de la factura para la suscripción\\n    v\_description := 'Suscripción Plan: ' || v\_plan\_name;\\n    v\_subtotal := v\_calculated\_price;\\n\\n    INSERT INTO public.invoice\_items (\\n        invoice\_id, subscription\_plan\_id, item\_type, description, quantity, unit\_price, total\_price\\n    ) VALUES (\\n        v\_invoice\_id, v\_plan\_id, 'SUBSCRIPTION\_PLAN', v\_description, 1, v\_calculated\_price, v\_subtotal\\n    ) RETURNING id INTO v\_invoice\_item\_id;\\n\\n    -- 5. Calcular y aplicar impuestos para este item\\n    FOR v\_tax\_record IN\\n        SELECT id, rate FROM public.generic\_taxes WHERE country\_id = v\_country\_id AND is\_active = TRUE\\n    LOOP\\n        DECLARE\\n            v\_tax\_amount NUMERIC;\\n        BEGIN\\n            v\_tax\_amount := v\_subtotal \* (v\_tax\_record.rate / 100);\\n            v\_total\_taxes := v\_total\_taxes + v\_tax\_amount;\\n\\n            INSERT INTO public.invoice\_item\_taxes (\\n                invoice\_item\_id, tax\_id, taxable\_amount, calculated\_tax\_amount\\n            ) VALUES (\\n                v\_invoice\_item\_id, v\_tax\_record.id, v\_subtotal, v\_tax\_amount\\n            );\\n        END;\\n    END LOOP;\\n\\n    -- 6. Actualizar la factura con los totales finales\\n    UPDATE public.invoices\\n    SET\\n        subtotal\_amount = v\_subtotal,\\n        total\_tax\_amount = v\_total\_taxes,\\n        total\_amount = v\_subtotal + v\_total\_taxes\\n    WHERE id = v\_invoice\_id;\\n\\n    -- 7. Devolver el ID de la factura creada\\n    RETURN v\_invoice\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_api\_health\_stats",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nWITH metrics\_last\_hour AS (\\n    SELECT\\n        response\_time\_ms,\\n        status\_code,\\n        created\_at\\n    FROM public.api\_request\_metrics\\n    WHERE created\_at >= now() - interval '60 minutes'\\n),\\nrpm\_data AS (\\n    SELECT\\n        date\_trunc('minute', created\_at) AS time\_bucket,\\n        count(\*) AS request\_count\\n    FROM metrics\_last\_hour\\n    GROUP BY time\_bucket\\n    ORDER BY time\_bucket\\n)\\nSELECT json\_build\_object(\\n    'avg\_latency\_ms', (SELECT COALESCE(avg(response\_time\_ms), 0) FROM metrics\_last\_hour),\\n    'error\_rate\_percentage', (\\n        SELECT COALESCE(\\n            (count(\*) FILTER (WHERE status\_code >= 500) \* 100.0) / NULLIF(count(\*), 0),\\n            0\\n        )\\n        FROM metrics\_last\_hour\\n    ),\\n    'requests\_per\_minute', (SELECT COALESCE(json\_agg(rpm\_data), '\[]'::json) FROM rpm\_data)\\n);\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_calculated\_plan\_prices",

&nbsp;   "parameters": "plan\_id uuid, plan\_name text, plan\_description text, plan\_features ARRAY, billing\_frequency\_months integer, price\_id uuid, base\_price\_cop numeric, extra\_branch\_price\_cop numeric, country\_id uuid, country\_name text, calculated\_price numeric, calculated\_extra\_branch\_price numeric, currency\_code text, currency\_symbol text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    var\_cop\_to\_usd\_rate NUMERIC;\\nBEGIN\\n    -- Obtener la tasa de cambio de USD a COP.\\n    SELECT rate INTO var\_cop\_to\_usd\_rate FROM public.exchange\_rates WHERE base\_currency\_code = 'USD' AND target\_currency\_code = 'COP';\\n\\n    IF var\_cop\_to\_usd\_rate IS NULL THEN\\n        RAISE EXCEPTION 'La tasa de cambio para COP no está disponible.';\\n    END IF;\\n\\n    RETURN QUERY\\n    WITH current\_prices AS (\\n        SELECT DISTINCT ON (subscription\_plan\_id)\\n            pp.id as price\_id,\\n            pp.subscription\_plan\_id,\\n            pp.base\_price\_cop,\\n            pp.extra\_branch\_price\_cop\\n        FROM public.plan\_price\_history pp\\n        WHERE pp.effective\_date <= CURRENT\_DATE\\n        ORDER BY pp.subscription\_plan\_id, pp.effective\_date DESC\\n    ),\\n    country\_rates AS (\\n        SELECT\\n            c.id AS cid,\\n            c.name AS cname,\\n            curr.code AS ccode,\\n            curr.symbol AS csymbol,\\n            er.rate AS usd\_to\_target\_rate\\n        FROM public.countries c\\n        JOIN public.currencies curr ON c.default\_currency\_id = curr.id\\n        LEFT JOIN public.exchange\_rates er ON curr.code = er.target\_currency\_code AND er.base\_currency\_code = 'USD'\\n        WHERE c.is\_active = TRUE\\n    )\\n    SELECT\\n        sp.id AS plan\_id,\\n        sp.name AS plan\_name,\\n        sp.description AS plan\_description,\\n        sp.features AS plan\_features,\\n        sp.billing\_frequency\_months, -- Campo añadido\\n        cp.price\_id,\\n        cp.base\_price\_cop,\\n        cp.extra\_branch\_price\_cop,\\n        cr.cid AS country\_id,\\n        cr.cname AS country\_name,\\n        CASE\\n            WHEN cr.ccode = 'COP' THEN cp.base\_price\_cop\\n            WHEN cr.usd\_to\_target\_rate IS NULL THEN NULL\\n            ELSE floor(cp.base\_price\_cop / var\_cop\_to\_usd\_rate \* cr.usd\_to\_target\_rate) + 0.99\\n        END AS calculated\_price,\\n        CASE\\n            WHEN cr.ccode = 'COP' THEN cp.extra\_branch\_price\_cop\\n            WHEN cr.usd\_to\_target\_rate IS NULL THEN NULL\\n            ELSE floor(cp.extra\_branch\_price\_cop / var\_cop\_to\_usd\_rate \* cr.usd\_to\_target\_rate) + 0.99\\n        END AS calculated\_extra\_branch\_price,\\n        cr.ccode AS currency\_code,\\n        cr.csymbol AS currency\_symbol\\n    FROM\\n        public.subscription\_plans sp\\n    JOIN current\_prices cp ON sp.id = cp.subscription\_plan\_id\\n    CROSS JOIN country\_rates cr\\n    ORDER BY\\n        sp.display\_order, cr.cname;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_current\_branch\_id",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\n  SELECT NULLIF(current\_setting('app.current\_assignment.branch\_id', TRUE), '')::UUID;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_current\_role\_name",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": "\\n  SELECT NULLIF(current\_setting('app.current\_assignment.role\_name', TRUE), '');\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_current\_tenant\_id",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\n  SELECT NULLIF(current\_setting('app.current\_assignment.tenant\_id', TRUE), '')::UUID;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_current\_user\_id",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\n  SELECT COALESCE(\\n    (current\_setting('request.jwt.claims', TRUE)::jsonb ->> 'sub')::uuid,\\n    NULLIF(current\_setting('app.current\_user\_id', TRUE), '')::UUID\\n  );\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_gmail\_auth\_url",

&nbsp;   "parameters": "p\_tenant\_id uuid, success boolean, url text, message text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_client\_id TEXT;\\n    v\_redirect\_uri TEXT;\\n    v\_state TEXT;\\n    v\_scope TEXT;\\n    v\_auth\_url TEXT;\\nBEGIN\\n    -- 1. Obtener configuración de la tabla public.integrations\_config\\n    SELECT value INTO v\_client\_id FROM public.integrations\_config WHERE key = 'google\_oauth\_client\_id';\\n    SELECT value INTO v\_redirect\_uri FROM public.integrations\_config WHERE key = 'google\_oauth\_redirect\_uri';\\n\\n    IF v\_client\_id IS NULL OR v\_redirect\_uri IS NULL OR v\_client\_id = 'TU\_CLIENT\_ID\_AQUI' THEN\\n        RETURN QUERY SELECT false, null, 'Client ID o Redirect URI de Google no configurados en integrations\_config.';\\n        RETURN;\\n    END IF;\\n\\n    -- 2. Construir el 'state'\\n    v\_state := p\_tenant\_id::text || ':google\_gmail';\\n\\n    -- 3. Definir el scope\\n    v\_scope := 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';\\n\\n    -- 4. Construir la URL\\n    v\_auth\_url := 'https://accounts.google.com/o/oauth2/v2/auth?' ||\\n                  'client\_id=' || url\_encode(v\_client\_id) ||\\n                  '\&redirect\_uri=' || url\_encode(v\_redirect\_uri) ||\\n                  '\&response\_type=code' ||\\n                  '\&scope=' || url\_encode(v\_scope) ||\\n                  '\&access\_type=offline' ||\\n                  '\&prompt=consent' ||\\n                  '\&state=' || url\_encode(v\_state);\\n\\n    RETURN QUERY SELECT true, v\_auth\_url, 'URL de autorización para Gmail generada.';\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_google\_auth\_url",

&nbsp;   "parameters": "p\_tenant\_id uuid, success boolean, url text, message text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_client\_id TEXT;\\n    v\_redirect\_uri TEXT;\\n    v\_state TEXT;\\n    v\_scope TEXT;\\n    v\_auth\_url TEXT;\\nBEGIN\\n    -- 1. Obtener configuración de la tabla public.integrations\_config\\n    SELECT value INTO v\_client\_id FROM public.integrations\_config WHERE key = 'google\_oauth\_client\_id';\\n    SELECT value INTO v\_redirect\_uri FROM public.integrations\_config WHERE key = 'google\_oauth\_redirect\_uri';\\n\\n    IF v\_client\_id IS NULL OR v\_redirect\_uri IS NULL OR v\_client\_id = 'TU\_CLIENT\_ID\_AQUI' THEN\\n        RETURN QUERY SELECT false, null, 'Client ID o Redirect URI de Google no configurados en integrations\_config.';\\n        RETURN;\\n    END IF;\\n\\n    -- 2. Construir el 'state'\\n    v\_state := p\_tenant\_id::text || ':google\_drive';\\n\\n    -- 3. Definir el scope\\n    v\_scope := 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';\\n\\n    -- 4. Construir la URL\\n    v\_auth\_url := 'https://accounts.google.com/o/oauth2/v2/auth?' ||\\n                  'client\_id=' || url\_encode(v\_client\_id) ||\\n                  '\&redirect\_uri=' || url\_encode(v\_redirect\_uri) ||\\n                  '\&response\_type=code' ||\\n                  '\&scope=' || url\_encode(v\_scope) ||\\n                  '\&access\_type=offline' ||\\n                  '\&prompt=consent' ||\\n                  '\&state=' || url\_encode(v\_state);\\n\\n    RETURN QUERY SELECT true, v\_auth\_url, 'URL de autorización para Google Drive generada.';\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_integration\_categories",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\n    -- La seguridad se maneja a nivel de RLS en la tabla.\\n    SELECT \* FROM integration\_categories ORDER BY name;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_my\_tenant\_info",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\n    SELECT \*\\n    FROM public.tenants\\n    WHERE id = (current\_setting('request.jwt.claims', true)::jsonb ->> 'tenant\_id')::uuid;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_public\_registration\_data",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\n  SELECT json\_build\_object(\\n    'countries', (\\n      SELECT json\_agg(\\n        json\_build\_object(\\n          'id', c.id,\\n          'name', c.name,\\n          'iso\_code', c.iso\_code,\\n          'default\_localization\_id', c.default\_localization\_id,\\n          'default\_currency\_id', c.default\_currency\_id,\\n          'timezone', c.timezone\\n        )\\n      )\\n      FROM countries c\\n      WHERE c.is\_active = true\\n    ),\\n    'languages', ( -- CORREGIDO: de 'localizations' a 'languages'\\n      SELECT json\_agg(\\n        json\_build\_object(\\n          'id', l.id,\\n          'name', l.name,\\n          'iso\_code', l.iso\_code\\n        )\\n      )\\n      FROM languages l -- CORREGIDO: de 'localizations' a 'languages'\\n      WHERE l.is\_active = true\\n    ),\\n    'currencies', (\\n      SELECT json\_agg(\\n        json\_build\_object(\\n          'id', curr.id,\\n          'name', curr.name,\\n          'symbol', curr.symbol\\n        )\\n      )\\n      FROM currencies curr\\n      WHERE curr.is\_active = true\\n    ),\\n    'timezones', (\\n      SELECT json\_agg(\\n        json\_build\_object(\\n          'name', t.name\\n        )\\n      )\\n      FROM timezones t\\n      WHERE t.is\_active = true\\n    )\\n  );\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_subscription\_plans\_for\_user",

&nbsp;   "parameters": "p\_user\_id uuid, plan\_id uuid, plan\_name text, plan\_description text, plan\_features ARRAY, billing\_frequency\_months integer, price\_id uuid, calculated\_price numeric, calculated\_extra\_branch\_price numeric, currency\_code text, currency\_symbol text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_tenant\_id UUID;\\n    v\_country\_id UUID;\\nBEGIN\\n    -- Lógica para obtener el país del tenant (sin cambios)\\n    SELECT tenant\_id INTO v\_tenant\_id FROM public.users WHERE id = p\_user\_id;\\n    IF v\_tenant\_id IS NULL THEN RAISE EXCEPTION 'Tenant no encontrado para el usuario: %', p\_user\_id; END IF;\\n    SELECT country\_id INTO v\_country\_id FROM public.tenants WHERE id = v\_tenant\_id;\\n    IF v\_country\_id IS NULL THEN RAISE EXCEPTION 'País no encontrado para el tenant: %', v\_tenant\_id; END IF;\\n\\n    -- Llamar a la función principal y devolver todos los campos necesarios\\n    RETURN QUERY\\n    SELECT\\n        gcp.plan\_id,\\n        gcp.plan\_name,\\n        gcp.plan\_description,\\n        gcp.plan\_features,\\n        gcp.billing\_frequency\_months,\\n        gcp.price\_id,\\n        gcp.calculated\_price,\\n        gcp.calculated\_extra\_branch\_price, -- Campo añadido\\n        gcp.currency\_code,\\n        gcp.currency\_symbol\\n    FROM\\n        public.get\_calculated\_plan\_prices() gcp\\n    WHERE\\n        gcp.country\_id = v\_country\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_superadmin\_financial\_stats",

&nbsp;   "parameters": "mrr numeric, arr numeric, projected\_revenue\_next\_7\_days numeric, projected\_revenue\_next\_30\_days numeric, active\_monthly\_plans bigint, active\_semestral\_plans bigint, active\_annual\_plans bigint, new\_tenants\_last\_30\_days bigint",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nBEGIN\\n    RETURN QUERY\\n    WITH current\_prices AS (\\n        -- 1. Obtener el precio vigente más reciente para cada plan\\n        SELECT DISTINCT ON (subscription\_plan\_id)\\n            subscription\_plan\_id,\\n            base\_price\_cop,\\n            extra\_branch\_price\_cop\\n        FROM public.plan\_price\_history\\n        WHERE effective\_date <= CURRENT\_DATE\\n        ORDER BY subscription\_plan\_id, effective\_date DESC\\n    ),\\n    active\_subs AS (\\n        -- 2. Obtener las suscripciones activas y unir con sus precios vigentes\\n        SELECT\\n            ts.tenant\_id,\\n            cp.base\_price\_cop,\\n            cp.extra\_branch\_price\_cop,\\n            sp.billing\_frequency\_months,\\n            ts.end\_date,\\n            (SELECT COUNT(\*) FROM public.branches b WHERE b.tenant\_id = ts.tenant\_id) as branch\_count\\n        FROM public.tenant\_subscriptions ts\\n        JOIN public.subscription\_plans sp ON ts.subscription\_plan\_id = sp.id\\n        JOIN current\_prices cp ON ts.subscription\_plan\_id = cp.subscription\_plan\_id\\n        WHERE ts.is\_active = TRUE\\n    ),\\n    sub\_costs AS (\\n        -- 3. Calcular el costo total y mensual por suscripción\\n        SELECT\\n            tenant\_id,\\n            end\_date,\\n            (COALESCE(base\_price\_cop, 0) + GREATEST(0, branch\_count - 1) \* COALESCE(extra\_branch\_price\_cop, 0)) AS total\_cost,\\n            (COALESCE(base\_price\_cop, 0) + GREATEST(0, branch\_count - 1) \* COALESCE(extra\_branch\_price\_cop, 0)) / GREATEST(1, billing\_frequency\_months) AS monthly\_cost\\n        FROM active\_subs\\n    )\\n    -- 4. Calcular las métricas finales\\n    SELECT\\n        (SELECT COALESCE(SUM(monthly\_cost), 0) FROM sub\_costs) AS mrr,\\n        (SELECT COALESCE(SUM(monthly\_cost), 0) \* 12 FROM sub\_costs) AS arr,\\n        (SELECT COALESCE(SUM(total\_cost), 0) FROM sub\_costs WHERE end\_date BETWEEN now() AND now() + interval '7 days') AS projected\_revenue\_next\_7\_days,\\n        (SELECT COALESCE(SUM(total\_cost), 0) FROM sub\_costs WHERE end\_date BETWEEN now() AND now() + interval '30 days') AS projected\_revenue\_next\_30\_days,\\n        (SELECT COUNT(\*) FROM active\_subs WHERE billing\_frequency\_months = 1) AS active\_monthly\_plans,\\n        (SELECT COUNT(\*) FROM active\_subs WHERE billing\_frequency\_months = 6) AS active\_semestral\_plans,\\n        (SELECT COUNT(\*) FROM active\_subs WHERE billing\_frequency\_months = 12) AS active\_annual\_plans,\\n        (SELECT COUNT(\*) FROM public.tenants WHERE created\_at >= now() - interval '30 days') AS new\_tenants\_last\_30\_days;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_system\_owner\_tenant\_id",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\n  SELECT id\\n  FROM public.tenants\\n  WHERE is\_system\_owner = true\\n  LIMIT 1;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_table\_names",

&nbsp;   "parameters": "table\_name text",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": "\\nBEGIN\\n    RETURN QUERY\\n    SELECT t.table\_name::text\\n    FROM information\_schema.tables t\\n    WHERE t.table\_schema = 'public' AND t.table\_type = 'BASE TABLE';\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_activity\_summary",

&nbsp;   "parameters": "tenant\_id uuid, tenant\_name text, total\_users bigint, total\_clients bigint, total\_appointments bigint, total\_services bigint, total\_products bigint",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\r\\nBEGIN\\r\\n    IF NOT (SELECT public.is\_super\_admin()) THEN\\r\\n        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver el resumen de actividad de los tenants.';\\r\\n    END IF;\\r\\n\\r\\n    RETURN QUERY\\r\\n    SELECT\\r\\n        t.id AS tenant\_id,\\r\\n        t.name AS tenant\_name,\\r\\n        (SELECT COUNT(\*) FROM public.users u WHERE u.tenant\_id = t.id) AS total\_users,\\r\\n        (SELECT COUNT(\*) FROM public.clients c WHERE c.tenant\_id = t.id) AS total\_clients,\\r\\n        (SELECT COUNT(\*) FROM public.attentions a WHERE a.tenant\_id = t.id) AS total\_appointments,\\r\\n        (SELECT COUNT(\*) FROM public.services s WHERE s.tenant\_id = t.id) AS total\_services,\\r\\n        (SELECT COUNT(\*) FROM public.products p WHERE p.tenant\_id = t.id) AS total\_products\\r\\n    FROM\\r\\n        public.tenants t\\r\\n    ORDER BY\\r\\n        t.name;\\r\\nEND;\\r\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_branches",

&nbsp;   "parameters": "p\_tenant\_id uuid",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\n  SELECT \*\\n  FROM public.branches\\n  WHERE tenant\_id = p\_tenant\_id\\n  ORDER BY is\_main\_branch DESC, name ASC;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_branches",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_requesting\_user\_role text, id uuid, name text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- Security Check\\n    IF p\_requesting\_user\_role != 'super\_admin' THEN\\n        RAISE EXCEPTION 'Access denied. Super admin role required.';\\n    END IF;\\n\\n    -- Return branches for the given tenant\\n    RETURN QUERY\\n    SELECT b.id, b.name\\n    FROM public.branches b\\n    WHERE b.tenant\_id = p\_tenant\_id\\n    ORDER BY b.name;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_integrations",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_user\_role text, p\_requesting\_user\_id uuid, p\_environment text, id uuid, tenant\_id uuid, provider text, access\_token text, account\_email text, created\_at timestamp with time zone, updated\_at timestamp with time zone, expires\_at timestamp with time zone, encrypted\_credentials text, nonce text, environment text, is\_active boolean",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_user\_tenant\_id UUID;\\nBEGIN\\n    -- La lógica de seguridad no cambia.\\n    IF p\_user\_role != 'super\_admin' THEN\\n        SELECT users.tenant\_id INTO v\_user\_tenant\_id\\n        FROM public.users\\n        WHERE users.id = p\_requesting\_user\_id;\\n\\n        IF v\_user\_tenant\_id IS NULL OR v\_user\_tenant\_id != p\_tenant\_id THEN\\n            RAISE EXCEPTION 'Acceso denegado. No tienes permiso para ver las integraciones de este tenant.';\\n        END IF;\\n    END IF;\\n\\n    -- La consulta ahora incluye la nueva columna.\\n    RETURN QUERY\\n    SELECT\\n        ti.id,\\n        ti.tenant\_id,\\n        ti.provider,\\n        ti.access\_token,\\n        ti.account\_email,\\n        ti.created\_at,\\n        ti.updated\_at,\\n        ti.expires\_at,\\n        ti.encrypted\_credentials,\\n        ti.nonce,\\n        ti.environment,\\n        ti.is\_active -- <-- Columna añadida\\n    FROM\\n        public.tenant\_integrations ti\\n    WHERE\\n        ti.tenant\_id = p\_tenant\_id\\n        AND (p\_environment IS NULL OR ti.environment = p\_environment);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_subscription\_status",

&nbsp;   "parameters": "p\_tenant\_id uuid, status text, end\_date timestamp with time zone",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_last\_subscription RECORD;\\n    OWNER\_TENANT\_ID UUID := '00000000-0000-0000-0000-000000000000';\\nBEGIN\\n    -- Caso especial para el tenant propietario del sistema\\n    IF p\_tenant\_id = OWNER\_TENANT\_ID THEN\\n        RETURN QUERY SELECT 'activo'::TEXT, NULL::TIMESTAMPTZ;\\n        RETURN;\\n    END IF;\\n\\n    -- Lógica normal para los demás tenants\\n    -- Encontrar la suscripción con la fecha de finalización más reciente, priorizando los NULLs\\n    SELECT \* INTO v\_last\_subscription\\n    FROM public.tenant\_subscriptions\\n    WHERE tenant\_id = p\_tenant\_id\\n    ORDER BY end\_date DESC NULLS FIRST; -- CORRECCIÓN: NULLS FIRST para priorizar suscripciones sin fecha de fin\\n\\n    -- Si no se encuentra ninguna suscripción, devolver cancelado\\n    IF v\_last\_subscription IS NULL THEN\\n        RETURN QUERY SELECT 'cancelado'::TEXT, NULL::TIMESTAMPTZ;\\n        RETURN;\\n    END IF;\\n\\n    -- Devolver el estado calculado y la fecha de finalización\\n    RETURN QUERY\\n    SELECT\\n        CASE\\n            -- Si la fecha de fin es nula, la suscripción es activa permanentemente\\n            WHEN v\_last\_subscription.end\_date IS NULL THEN 'activo'::TEXT\\n            -- Lógica de estados basada en fechas\\n            WHEN NOW() >= v\_last\_subscription.start\_date AND NOW() <= v\_last\_subscription.end\_date THEN 'activo'::TEXT\\n            WHEN NOW() > v\_last\_subscription.end\_date AND NOW() <= (v\_last\_subscription.end\_date + '3 days'::interval) THEN 'gracia'::TEXT\\n            WHEN NOW() > (v\_last\_subscription.end\_date + '3 days'::interval) AND NOW() <= (v\_last\_subscription.end\_date + '3 months'::interval) THEN 'suspendido'::TEXT\\n            ELSE 'cancelado'::TEXT\\n        END AS status,\\n        v\_last\_subscription.end\_date;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenant\_users",

&nbsp;   "parameters": "target\_tenant\_id uuid, p\_user\_role text, id uuid, email text, role\_name text, is\_active boolean, created\_at timestamp with time zone, tenant\_id uuid",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nBEGIN\\n  -- Paso 1: Comprobar si el rol del usuario que llama es 'super\_admin'\\n  IF p\_user\_role != 'super\_admin' THEN\\n    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super\_admin.';\\n  END IF;\\n\\n  -- Paso 2: Ejecutar la consulta que ya ha sido probada y validada\\n  RETURN QUERY\\n  SELECT\\n    u.id,\\n    u.email,\\n    r.name as role\_name,\\n    u.is\_active,\\n    u.created\_at,\\n    u.tenant\_id\\n  FROM\\n    public.users u\\n  JOIN\\n    public.roles r ON u.role\_id = r.id\\n  WHERE\\n    u.tenant\_id = target\_tenant\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_tenants\_with\_metrics",

&nbsp;   "parameters": "search\_term\_param text, id uuid, name text, subscription\_status text, created\_at timestamp with time zone, updated\_at timestamp with time zone, default\_language\_code text, default\_currency\_id uuid, default\_timezone text, contact\_person text, contact\_email text, contact\_phone text, country\_id uuid, is\_active boolean, logo\_url text, notes text, legal\_name text, tax\_id text, billing\_address text, website text, whatsapp\_phone text, einvoicing\_email text, physical\_address\_line1 text, physical\_address\_line2 text, physical\_city text, physical\_state text, physical\_postal\_code text, latitude text, longitude text, commercial\_email text, country\_name text, country\_iso\_code text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\nBEGIN\\n    RETURN QUERY\\n    SELECT\\n        t.id,\\n        t.name,\\n        (SELECT status FROM public.get\_tenant\_subscription\_status(t.id)), -- Llama a la nueva función\\n        t.created\_at,\\n        t.updated\_at,\\n        t.default\_language\_code,\\n        t.default\_currency\_id,\\n        t.default\_timezone,\\n        t.contact\_person,\\n        t.contact\_email,\\n        t.contact\_phone,\\n        t.country\_id,\\n        t.is\_active,\\n        t.logo\_url,\\n        t.notes,\\n        t.legal\_name,\\n        t.tax\_id,\\n        t.billing\_address,\\n        t.website,\\n        t.whatsapp\_phone,\\n        t.einvoicing\_email,\\n        t.physical\_address\_line1,\\n        t.physical\_address\_line2,\\n        t.physical\_city,\\n        t.physical\_state,\\n        t.physical\_postal\_code,\\n        t.latitude::text,\\n        t.longitude::text,\\n        t.commercial\_email,\\n        c.name as country\_name,\\n        c.iso\_code as country\_iso\_code\\n    FROM\\n        public.tenants t\\n    LEFT JOIN\\n        public.countries c ON t.country\_id = c.id\\n    WHERE\\n        search\_term\_param IS NULL OR\\n        t.name ILIKE '%' || search\_term\_param || '%' OR\\n        t.legal\_name ILIKE '%' || search\_term\_param || '%' OR\\n        t.commercial\_email ILIKE '%' || search\_term\_param || '%' OR\\n        t.tax\_id ILIKE '%' || search\_term\_param || '%'\\n    ORDER BY\\n        t.name ASC;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_usage\_statistics",

&nbsp;   "parameters": "total\_logins bigint, total\_appointments\_created bigint, total\_products\_sold bigint, total\_services\_rendered bigint",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": "\\r\\nBEGIN\\r\\n    IF NOT (SELECT public.is\_super\_admin()) THEN\\r\\n        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver las estadísticas de uso.';\\r\\n    END IF;\\r\\n\\r\\n    RETURN QUERY\\r\\n    SELECT\\r\\n        (SELECT COUNT(\*) FROM public.audit\_logs WHERE action = 'user\_login') AS total\_logins,\\r\\n        (SELECT COUNT(\*) FROM public.attentions) AS total\_appointments\_created,\\r\\n        (SELECT SUM(quantity) FROM public.attention\_products) AS total\_products\_sold,\\r\\n        (SELECT COUNT(\*) FROM public.attention\_services) AS total\_services\_rendered;\\r\\nEND;\\r\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "get\_user\_claims\_from\_jwt",

&nbsp;   "parameters": "jwt\_token text",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    claims JSONB;\\nBEGIN\\n    claims := auth.jwt\_verify(jwt\_token);\\n    RETURN claims;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "handle\_updated\_at",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n    NEW.updated\_at = now();\\n    RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "hmac",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http",

&nbsp;   "parameters": "request USER-DEFINED",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_delete",

&nbsp;   "parameters": "uri character varying, uri character varying, content character varying, content\_type character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_get",

&nbsp;   "parameters": "uri character varying, uri character varying, data jsonb",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_head",

&nbsp;   "parameters": "uri character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_header",

&nbsp;   "parameters": "field character varying, value character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_list\_curlopt",

&nbsp;   "parameters": "curlopt text, value text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_patch",

&nbsp;   "parameters": "uri character varying, content character varying, content\_type character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_post",

&nbsp;   "parameters": "uri character varying, uri character varying, data jsonb, content character varying, content\_type character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_put",

&nbsp;   "parameters": "uri character varying, content character varying, content\_type character varying",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_reset\_curlopt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "http\_set\_curlopt",

&nbsp;   "parameters": "curlopt character varying, value character varying",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "is\_super\_admin",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\n  SELECT get\_current\_role\_name() = 'super\_admin';\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "is\_tenant\_admin",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\n  SELECT get\_current\_role\_name() = 'tenant\_admin' AND get\_current\_tenant\_id() IS NOT NULL AND get\_current\_branch\_id() IS NOT NULL;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "is\_tenant\_super\_admin",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\n  SELECT get\_current\_role\_name() = 'tenant\_super\_admin' AND get\_current\_tenant\_id() IS NOT NULL;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "is\_tenant\_user",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\n  SELECT get\_current\_role\_name() = 'tenant\_user' AND get\_current\_tenant\_id() IS NOT NULL AND get\_current\_branch\_id() IS NOT NULL;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "log\_audit\_action",

&nbsp;   "parameters": "p\_action text, p\_object\_type text, p\_object\_id uuid, p\_old\_value jsonb, p\_new\_value jsonb, p\_ip\_address inet, p\_user\_agent text, p\_metadata jsonb, p\_tenant\_id uuid, p\_branch\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_user\_id uuid;\\n    v\_tenant\_id uuid;\\n    v\_branch\_id uuid;\\nBEGIN\\n    -- Intenta obtener user\_id del contexto de la sesión actual\\n    SELECT auth.uid() INTO v\_user\_id;\\n    \\n    -- Prioriza los IDs pasados como parámetro, luego el contexto de la sesión\\n    v\_tenant\_id := COALESCE(p\_tenant\_id, current\_setting('app.tenant\_id', true)::uuid);\\n    v\_branch\_id := COALESCE(p\_branch\_id, current\_setting('app.branch\_id', true)::uuid);\\n\\n    INSERT INTO public.audit\_logs (\\n        user\_id,\\n        tenant\_id,\\n        branch\_id,\\n        action,\\n        object\_type,\\n        object\_id,\\n        old\_value,\\n        new\_value,\\n        ip\_address,\\n        user\_agent,\\n        metadata\\n    ) VALUES (\\n        v\_user\_id,\\n        v\_tenant\_id,\\n        v\_branch\_id,\\n        p\_action,\\n        p\_object\_type,\\n        p\_object\_id,\\n        p\_old\_value,\\n        p\_new\_value,\\n        p\_ip\_address,\\n        p\_user\_agent,\\n        p\_metadata\\n    );\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "log\_branch\_status\_change",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- For UPDATEs, only log if the status actually changed.\\n    -- For INSERTs, OLD is NULL, so the condition is met and the initial state is logged.\\n    IF TG\_OP = 'INSERT' OR (OLD.status IS DISTINCT FROM NEW.status) THEN\\n        INSERT INTO public.branch\_status\_history (branch\_id, status, changed\_at)\\n        VALUES (NEW.id, NEW.status, NOW());\\n    END IF;\\n    RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "login\_user",

&nbsp;   "parameters": "p\_email text, p\_password text",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    user\_profile RECORD;\\n    user\_assignments\_json JSONB;\\nBEGIN\\n    -- Verificar credenciales y obtener perfil del usuario, incluyendo configuración regional.\\n    SELECT \\n        u.id, \\n        u.email, \\n        u.first\_name, \\n        u.last\_name, \\n        u.avatar\_url,\\n        u.country\_id,\\n        u.language\_id,\\n        u.currency\_id,\\n        u.timezone\_id\\n    INTO user\_profile\\n    FROM public.users u\\n    WHERE u.email = p\_email AND u.password\_hash = crypt(p\_password, u.password\_hash) AND u.is\_active = TRUE;\\n\\n    -- Si no se encuentra el usuario, las credenciales son inválidas.\\n    IF user\_profile.id IS NULL THEN\\n        RETURN jsonb\_build\_object('success', false, 'message', 'Invalid credentials');\\n    END IF;\\n\\n    -- Obtener todas las asignaciones del usuario y convertirlas a un array JSON.\\n    SELECT jsonb\_agg(assignments)\\n    INTO user\_assignments\_json\\n    FROM (\\n        SELECT\\n            ua.id as assignment\_id,\\n            ua.tenant\_id,\\n            t.name as tenant\_name,\\n            ua.role\_id,\\n            r.name as role\_name,\\n            ua.branch\_id,\\n            b.name as branch\_name\\n        FROM public.user\_assignments ua\\n        JOIN public.roles r ON ua.role\_id = r.id\\n        JOIN public.tenants t ON ua.tenant\_id = t.id\\n        LEFT JOIN public.branches b ON ua.branch\_id = b.id\\n        WHERE ua.user\_id = user\_profile.id\\n    ) as assignments;\\n\\n    -- Devolver el objeto de respuesta final.\\n    RETURN jsonb\_build\_object(\\n        'success', true,\\n        'profile', to\_jsonb(user\_profile),\\n        'assignments', COALESCE(user\_assignments\_json, '\[]'::jsonb)\\n    );\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "manage\_subscription\_lifecycles",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n    sub RECORD;\\n    grace\_days INT;\\nBEGIN\\n    -- Iterar sobre todas las suscripciones activas cuya fecha de finalización ha pasado.\\n    FOR sub IN\\n        SELECT\\n            ts.id AS subscription\_id,\\n            ts.tenant\_id,\\n            ts.is\_trial,\\n            ts.end\_date,\\n            sp.grace\_period\_days AS plan\_grace\_days\\n        FROM\\n            public.tenant\_subscriptions ts\\n        LEFT JOIN\\n            public.subscription\_plans sp ON ts.subscription\_plan\_id = sp.id\\n        WHERE\\n            ts.is\_active = TRUE AND ts.end\_date < now()\\n    LOOP\\n        -- Determinar el período de gracia aplicable.\\n        IF sub.is\_trial THEN\\n            SELECT gs.trial\_grace\_period\_days INTO grace\_days FROM public.global\_settings gs LIMIT 1;\\n            grace\_days := COALESCE(grace\_days, 3); -- Fallback por si no está configurado.\\n        ELSE\\n            grace\_days := COALESCE(sub.plan\_grace\_days, 7); -- Fallback por si el plan no tiene días de gracia.\\n        END IF;\\n\\n        -- Comprobar si estamos dentro del período de gracia.\\n        IF now() <= sub.end\_date + (grace\_days || ' days')::interval THEN\\n            -- Aún en período de gracia.\\n            UPDATE public.tenants\\n            SET subscription\_status = 'grace\_period'\\n            WHERE id = sub.tenant\_id AND subscription\_status != 'grace\_period';\\n\\n            RAISE NOTICE 'Tenant % entra en período de gracia.', sub.tenant\_id;\\n        ELSE\\n            -- El período de gracia ha terminado.\\n            IF sub.is\_trial THEN\\n                -- Finalizar el trial.\\n                UPDATE public.tenants\\n                SET subscription\_status = 'trial\_ended'\\n                WHERE id = sub.tenant\_id;\\n\\n                RAISE NOTICE 'El período de prueba para el tenant % ha finalizado completamente.', sub.tenant\_id;\\n            ELSE\\n                -- Desactivar por falta de pago.\\n                UPDATE public.tenants\\n                SET subscription\_status = 'inactive'\\n                WHERE id = sub.tenant\_id;\\n\\n                RAISE NOTICE 'La suscripción del tenant % ha sido desactivada por falta de pago.', sub.tenant\_id;\\n            END IF;\\n\\n            -- Marcar la suscripción como inactiva en ambos casos.\\n            UPDATE public.tenant\_subscriptions\\n            SET is\_active = FALSE\\n            WHERE id = sub.subscription\_id;\\n        END IF;\\n    END LOOP;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "moddatetime",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_armor\_headers",

&nbsp;   "parameters": "key text, value text",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_key\_id",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_pub\_decrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_pub\_decrypt\_bytea",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_pub\_encrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_pub\_encrypt\_bytea",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_sym\_decrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_sym\_decrypt\_bytea",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_sym\_encrypt",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "pgp\_sym\_encrypt\_bytea",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "register\_new\_tenant",

&nbsp;   "parameters": "p\_business\_name text, p\_admin\_email text, p\_admin\_password text",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_tenant\_id UUID;\\n    v\_branch\_id UUID;\\n    v\_role\_id UUID;\\n    v\_user\_id UUID;\\n    v\_hashed\_password TEXT;\\nBEGIN\\n    -- Hash the password (sin cambios)\\n    v\_hashed\_password := crypt(p\_admin\_password, gen\_salt('bf'));\\n\\n    -- Insert new tenant (sin cambios)\\n    INSERT INTO public.tenants (name, subscription\_status)\\n    VALUES (p\_business\_name, 'trial')\\n    RETURNING id INTO v\_tenant\_id;\\n\\n    -- Insert main branch for the new tenant (sin cambios)\\n    INSERT INTO public.branches (tenant\_id, name, address)\\n    VALUES (v\_tenant\_id, 'Main Branch', 'Default Address')\\n    RETURNING id INTO v\_branch\_id;\\n\\n    -- Get the role\_id for 'tenant\_super\_admin' (sin cambios)\\n    SELECT id INTO v\_role\_id FROM public.roles WHERE name = 'tenant\_super\_admin';\\n\\n    -- Insert the admin user (REFACTORIZADO)\\n    -- Se inserta solo la identidad en 'users'.\\n    INSERT INTO public.users (email, password\_hash, is\_active)\\n    VALUES (p\_admin\_email, v\_hashed\_password, TRUE)\\n    RETURNING id INTO v\_user\_id;\\n\\n    -- Create the assignment in the new table (NUEVO)\\n    -- Se vincula el usuario con el tenant y el rol. branch\_id es NULL para este rol.\\n    INSERT INTO public.user\_assignments (user\_id, tenant\_id, role\_id, branch\_id)\\n    VALUES (v\_user\_id, v\_tenant\_id, v\_role\_id, NULL);\\n\\n    RETURN v\_tenant\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "renew\_subscription",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_plan\_id uuid",

&nbsp;   "return\_type": "uuid",

&nbsp;   "source\_code": "\\nDECLARE\\n    previous\_subscription RECORD;\\n    new\_start\_date TIMESTAMPTZ;\\n    new\_end\_date TIMESTAMPTZ;\\n    plan\_duration\_months INT;\\n    new\_subscription\_id UUID;\\n    generated\_invoice\_id UUID;\\nBEGIN\\n    -- 1. Encontrar la suscripción más reciente (activa o no) para este tenant.\\n    SELECT \* INTO previous\_subscription\\n    FROM public.tenant\_subscriptions\\n    WHERE tenant\_id = p\_tenant\_id\\n    ORDER BY end\_date DESC NULLS LAST, created\_at DESC\\n    LIMIT 1;\\n\\n    -- 2. Determinar la fecha de inicio de la nueva suscripción.\\n    IF previous\_subscription IS NOT NULL AND previous\_subscription.end\_date IS NOT NULL THEN\\n        -- Renovación: la nueva suscripción empieza donde terminó la anterior.\\n        new\_start\_date := previous\_subscription.end\_date;\\n    ELSE\\n        -- Primera suscripción después de un trial o si no hay registro previo.\\n        new\_start\_date := now();\\n    END IF;\\n\\n    -- 3. Calcular la nueva fecha de finalización.\\n    SELECT billing\_frequency\_months INTO plan\_duration\_months\\n    FROM public.subscription\_plans\\n    WHERE id = p\_plan\_id;\\n\\n    IF plan\_duration\_months IS NULL THEN\\n        RAISE EXCEPTION 'No se pudo encontrar la duración para el plan ID %.', p\_plan\_id;\\n    END IF;\\n\\n    new\_end\_date := new\_start\_date + (plan\_duration\_months || ' months')::interval;\\n\\n    -- 4. Crear la nueva suscripción de pago.\\n    INSERT INTO public.tenant\_subscriptions (\\n        tenant\_id,\\n        subscription\_plan\_id,\\n        is\_trial,\\n        start\_date,\\n        end\_date,\\n        is\_active\\n    ) VALUES (\\n        p\_tenant\_id,\\n        p\_plan\_id,\\n        FALSE,\\n        new\_start\_date,\\n        new\_end\_date,\\n        TRUE\\n    ) RETURNING id INTO new\_subscription\_id;\\n\\n    -- 5. Actualizar el estado del tenant a 'active'.\\n    UPDATE public.tenants\\n    SET subscription\_status = 'active'\\n    WHERE id = p\_tenant\_id;\\n\\n    -- 6. Generar la factura para la nueva suscripción.\\n    SELECT public.generate\_invoice\_for\_subscription(new\_subscription\_id)\\n    INTO generated\_invoice\_id;\\n\\n    RAISE NOTICE 'Suscripción renovada con ID: %. Factura generada con ID: %', new\_subscription\_id, generated\_invoice\_id;\\n\\n    -- 7. Devolver el ID de la nueva suscripción.\\n    RETURN new\_subscription\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "set\_active\_integration",

&nbsp;   "parameters": "p\_integration\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_tenant\_id UUID;\\n    v\_provider TEXT;\\nBEGIN\\n    -- 1. Verificar que el usuario solicitante es un super\_admin usando la función de ayuda.\\n    IF NOT public.is\_super\_admin() THEN\\n        RAISE EXCEPTION 'Acceso denegado. Solo los super administradores pueden cambiar integraciones activas.';\\n    END IF;\\n\\n    -- 2. Obtener el tenant\_id y el provider de la integración que se va a activar.\\n    SELECT tenant\_id, provider INTO v\_tenant\_id, v\_provider\\n    FROM public.tenant\_integrations\\n    WHERE id = p\_integration\_id;\\n\\n    IF v\_tenant\_id IS NULL THEN\\n        RAISE EXCEPTION 'Integración no encontrada.';\\n    END IF;\\n\\n    -- 3. Desactivar todas las demás integraciones para ese tenant y proveedor.\\n    UPDATE public.tenant\_integrations\\n    SET is\_active = false\\n    WHERE tenant\_id = v\_tenant\_id\\n      AND provider = v\_provider\\n      AND id != p\_integration\_id;\\n\\n    -- 4. Activar la integración seleccionada.\\n    UPDATE public.tenant\_integrations\\n    SET is\_active = true\\n    WHERE id = p\_integration\_id;\\n\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "sign",

&nbsp;   "parameters": "payload json, secret text, algorithm text",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "tenant\_branch\_rls\_policy",

&nbsp;   "parameters": "table\_tenant\_id uuid, table\_branch\_id uuid",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\nBEGIN\\n  RETURN is\_super\_admin() OR\\n         (is\_tenant\_super\_admin() AND table\_tenant\_id = get\_current\_tenant\_id()) OR\\n         (is\_tenant\_admin() AND table\_tenant\_id = get\_current\_tenant\_id() AND table\_branch\_id = get\_current\_branch\_id()) OR\\n         (is\_tenant\_user() AND table\_tenant\_id = get\_current\_tenant\_id() AND table\_branch\_id = get\_current\_branch\_id());\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "tenant\_only\_rls\_policy",

&nbsp;   "parameters": "table\_tenant\_id uuid",

&nbsp;   "return\_type": "boolean",

&nbsp;   "source\_code": "\\nBEGIN\\n  RETURN is\_super\_admin() OR\\n         (is\_tenant\_super\_admin() AND table\_tenant\_id = get\_current\_tenant\_id()) OR\\n         (is\_tenant\_admin() AND table\_tenant\_id = get\_current\_tenant\_id()) OR\\n         (is\_tenant\_user() AND table\_tenant\_id = get\_current\_tenant\_id());\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "text\_to\_bytea",

&nbsp;   "parameters": "data text",

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "trigger\_system\_email",

&nbsp;   "parameters": "p\_recipient\_user\_id uuid, p\_template\_type text, p\_template\_data jsonb",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_send\_result JSONB;\\n    v\_recipient\_email TEXT;\\n    v\_language\_id UUID;\\n    v\_tenant\_id UUID;\\n    v\_template\_id UUID;\\n    v\_template\_subject TEXT;\\n    v\_template\_body\_html TEXT;\\n    v\_processed\_subject TEXT;\\n    v\_processed\_body\_html TEXT;\\n    v\_is\_tenant\_sending\_active BOOLEAN;\\n    v\_key TEXT;\\n    v\_value TEXT;\\n    v\_default\_language\_id UUID;\\nBEGIN\\n    SELECT id INTO v\_default\_language\_id FROM public.languages WHERE iso\_code = 'es-CO';\\n\\n    SELECT u.email, COALESCE(u.language\_id, v\_default\_language\_id), u.tenant\_id\\n    INTO v\_recipient\_email, v\_language\_id, v\_tenant\_id\\n    FROM public.users u\\n    WHERE u.id = p\_recipient\_user\_id;\\n\\n    IF NOT FOUND THEN\\n        INSERT INTO public.email\_logs (tenant\_id, recipient\_email, status, error\_message)\\n        VALUES ('00000000-0000-0000-0000-000000000000', 'unknown\_user', 'FAILED', 'Recipient user with ID ' || p\_recipient\_user\_id || ' not found.');\\n        RETURN;\\n    END IF;\\n\\n    IF v\_tenant\_id IS NOT NULL THEN\\n        SELECT is\_active INTO v\_is\_tenant\_sending\_active\\n        FROM public.tenant\_template\_settings\\n        WHERE tenant\_id = v\_tenant\_id AND template\_type = p\_template\_type;\\n\\n        IF v\_is\_tenant\_sending\_active IS NULL OR v\_is\_tenant\_sending\_active = false THEN\\n            IF p\_template\_type NOT IN ('WELCOME\_USER', 'PASSWORD\_RESET') THEN\\n                RETURN;\\n            END IF;\\n        END IF;\\n    END IF;\\n\\n    SELECT id, subject, body\_html INTO v\_template\_id, v\_template\_subject, v\_template\_body\_html\\n    FROM public.email\_templates\\n    WHERE tenant\_id = '00000000-0000-0000-0000-000000000000'\\n      AND template\_type = p\_template\_type\\n      AND language\_id = v\_language\_id\\n      AND is\_active = true;\\n\\n    IF NOT FOUND THEN\\n        INSERT INTO public.email\_logs (tenant\_id, recipient\_email, status, error\_message)\\n        VALUES (COALESCE(v\_tenant\_id, '00000000-0000-0000-0000-000000000000'), v\_recipient\_email, 'FAILED', 'Active master template not found for type ' || p\_template\_type || ' and language\_id ' || v\_language\_id);\\n        RETURN;\\n    END IF;\\n\\n    v\_processed\_subject := v\_template\_subject;\\n    v\_processed\_body\_html := v\_template\_body\_html;\\n\\n    FOR v\_key, v\_value IN SELECT \* FROM jsonb\_each\_text(p\_template\_data)\\n    LOOP\\n        v\_processed\_subject := replace(v\_processed\_subject, '{{' || v\_key || '}}', v\_value);\\n        v\_processed\_body\_html := replace(v\_processed\_body\_html, '{{' || v\_key || '}}', v\_value);\\n    END LOOP;\\n\\n    v\_send\_result := private.send\_email\_via\_gmail\_api(v\_recipient\_email, v\_processed\_subject, v\_processed\_body\_html);\\n\\n    IF (v\_send\_result->>'success')::BOOLEAN THEN\\n        INSERT INTO public.email\_logs (tenant\_id, recipient\_email, template\_id, status)\\n        VALUES (COALESCE(v\_tenant\_id, '00000000-0000-0000-0000-000000000000'), v\_recipient\_email, v\_template\_id, 'SENT');\\n    ELSE\\n        INSERT INTO public.email\_logs (tenant\_id, recipient\_email, template\_id, status, error\_message)\\n        VALUES (COALESCE(v\_tenant\_id, '00000000-0000-0000-0000-000000000000'), v\_recipient\_email, v\_template\_id, 'FAILED', v\_send\_result->>'error');\\n    END IF;\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        INSERT INTO public.email\_logs (tenant\_id, recipient\_email, template\_id, status, error\_message)\\n        VALUES ('00000000-0000-0000-0000-000000000000', COALESCE(v\_recipient\_email, 'unknown'), v\_template\_id, 'FAILED', SQLERRM);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "trigger\_test\_email\_for\_tenant",

&nbsp;   "parameters": "p\_tenant\_id uuid",

&nbsp;   "return\_type": "jsonb",

&nbsp;   "source\_code": "\\nDECLARE\\n    v\_super\_admin\_user RECORD;\\n    v\_full\_name TEXT;\\nBEGIN\\n    -- Encontrar al super\_admin del sistema\\n    SELECT u.id, u.first\_name, u.last\_name INTO v\_super\_admin\_user\\n    FROM public.users u\\n    JOIN public.roles r ON u.role\_id = r.id\\n    WHERE r.name = 'super\_admin'\\n    LIMIT 1;\\n\\n    IF NOT FOUND THEN\\n        RETURN jsonb\_build\_object('success', false, 'message', 'No se encontró al usuario super\_admin del sistema.');\\n    END IF;\\n\\n    -- Construir el nombre completo\\n    v\_full\_name := TRIM(COALESCE(v\_super\_admin\_user.first\_name, '') || ' ' || COALESCE(v\_super\_admin\_user.last\_name, ''));\\n    IF v\_full\_name = '' THEN\\n        v\_full\_name := 'Super Administrador';\\n    END IF;\\n\\n    -- Llamar a la función principal de envío de correos\\n    PERFORM public.trigger\_system\_email(\\n        p\_recipient\_user\_id := v\_super\_admin\_user.id,\\n        p\_template\_type := 'WELCOME\_USER',\\n        p\_template\_data := jsonb\_build\_object('user\_name', v\_full\_name)\\n    );\\n\\n    RETURN jsonb\_build\_object('success', true, 'message', 'El correo de prueba ha sido puesto en la cola de envío.');\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RETURN jsonb\_build\_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "try\_cast\_double",

&nbsp;   "parameters": "inp text",

&nbsp;   "return\_type": "double precision",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_branch",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_branch\_id uuid, p\_name text, p\_address text",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\nDECLARE\\n    updated\_branch public.branches;\\nBEGIN\\n    UPDATE public.branches SET name = p\_name, address = p\_address, updated\_at = NOW()\\n    WHERE id = p\_branch\_id AND tenant\_id = p\_tenant\_id\\n    RETURNING \* INTO updated\_branch;\\n    IF updated\_branch IS NULL THEN RAISE EXCEPTION 'Branch not found or access denied for this tenant'; END IF;\\n    RETURN updated\_branch;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_integration\_category",

&nbsp;   "parameters": "p\_id uuid, p\_name text, p\_slug text, p\_description text",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- La RLS de la tabla previene la actualización si el usuario no es superadmin.\\n    RETURN QUERY\\n    UPDATE integration\_categories\\n    SET\\n        name = p\_name,\\n        slug = p\_slug,\\n        description = p\_description,\\n        updated\_at = NOW()\\n    WHERE id = p\_id\\n    RETURNING \*;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_password\_with\_token",

&nbsp;   "parameters": "p\_token text, p\_new\_password text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    token\_record RECORD;\\nBEGIN\\n    -- 1. Find the token in the table\\n    SELECT \* INTO token\_record\\n    FROM public.password\_reset\_tokens\\n    WHERE token = p\_token;\\n\\n    -- 2. Validate the token\\n    IF token\_record IS NULL THEN\\n        RAISE EXCEPTION 'Token inválido o no encontrado.';\\n    END IF;\\n\\n    IF token\_record.used\_at IS NOT NULL THEN\\n        RAISE EXCEPTION 'Este token ya ha sido utilizado.';\\n    END IF;\\n\\n    IF token\_record.expires\_at < now() THEN\\n        RAISE EXCEPTION 'Este token ha expirado.';\\n    END IF;\\n\\n    -- 3. Update the user's password in the public.users table\\n    UPDATE public.users\\n    SET password\_hash = public.crypt(p\_new\_password, public.gen\_salt('bf'))\\n    WHERE id = token\_record.user\_id;\\n\\n    -- 4. Mark the token as used\\n    UPDATE public.password\_reset\_tokens\\n    SET used\_at = now()\\n    WHERE id = token\_record.id;\\n\\n    -- 5. Return a success message\\n    RETURN json\_build\_object(\\n        'success', TRUE,\\n        'message', 'Contraseña actualizada correctamente.'\\n    );\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_product\_costs",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nDECLARE\\n  costing\_method text;\\n  current\_avg\_cost numeric;\\n  current\_stock integer;\\n  new\_avg\_cost numeric;\\nBEGIN\\n  -- Obtener método de costeo de configuración\\n  SELECT value INTO costing\_method \\n  FROM settings \\n  WHERE key = 'costing\_method';\\n  \\n  -- Si no hay configuración, usar promedio por defecto\\n  IF costing\_method IS NULL THEN\\n    costing\_method := 'average';\\n  END IF;\\n  \\n  -- Obtener stock y costo promedio actual\\n  SELECT COALESCE(stock\_quantity, 0), COALESCE(average\_cost, 0)\\n  INTO current\_stock, current\_avg\_cost\\n  FROM products \\n  WHERE id = NEW.product\_id;\\n  \\n  -- Actualizar stock y último costo de compra\\n  UPDATE products \\n  SET stock\_quantity = COALESCE(stock\_quantity, 0) + NEW.quantity,\\n      last\_purchase\_cost = NEW.unit\_cost\\n  WHERE id = NEW.product\_id;\\n  \\n  -- Calcular y actualizar costo promedio\\n  IF costing\_method = 'average' THEN\\n    IF current\_stock = 0 OR current\_avg\_cost = 0 THEN\\n      new\_avg\_cost := NEW.unit\_cost;\\n    ELSE\\n      new\_avg\_cost := ((current\_avg\_cost \* current\_stock) + (NEW.unit\_cost \* NEW.quantity)) / (current\_stock + NEW.quantity);\\n    END IF;\\n    \\n    UPDATE products \\n    SET average\_cost = new\_avg\_cost,\\n        cost\_price = new\_avg\_cost\\n    WHERE id = NEW.product\_id;\\n  ELSIF costing\_method = 'last\_purchase' THEN\\n    UPDATE products \\n    SET cost\_price = NEW.unit\_cost,\\n        average\_cost = NEW.unit\_cost\\n    WHERE id = NEW.product\_id;\\n  END IF;\\n  \\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_updated\_at\_column",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nBEGIN\\n  NEW.updated\_at = now();\\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_user\_active\_status",

&nbsp;   "parameters": "target\_user\_id uuid, p\_is\_active boolean, p\_user\_role text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nBEGIN\\n  -- Security check: only super\_admin can perform this action\\n  IF p\_user\_role != 'super\_admin' THEN\\n    RAISE EXCEPTION 'Access denied. Super admin role required.';\\n  END IF;\\n\\n  -- Update the is\_active flag in the public.users table\\n  UPDATE public.users\\n  SET is\_active = p\_is\_active\\n  WHERE id = target\_user\_id;\\n\\n  -- Return a success confirmation\\n  RETURN json\_build\_object('success', TRUE, 'message', 'User status updated successfully.');\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_user\_password",

&nbsp;   "parameters": "p\_old\_password text, p\_new\_password text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nDECLARE\\n    user\_record RECORD;\\n    current\_user\_id UUID;\\nBEGIN\\n    -- 1. Get the current user's ID from the session context\\n    current\_user\_id := (current\_setting('app.current\_user\_id', TRUE)::uuid);\\n\\n    IF current\_user\_id IS NULL THEN\\n        RAISE EXCEPTION 'No active user session found.';\\n    END IF;\\n\\n    -- 2. Find the user in the public.users table\\n    SELECT \* INTO user\_record\\n    FROM public.users\\n    WHERE id = current\_user\_id;\\n\\n    -- 3. Verify the old password\\n    IF user\_record.password\_hash IS NULL OR public.crypt(p\_old\_password, user\_record.password\_hash) <> user\_record.password\_hash THEN\\n        RAISE EXCEPTION 'La contraseña actual es incorrecta.';\\n    END IF;\\n\\n    -- 4. Update to the new password\\n    UPDATE public.users\\n    SET password\_hash = public.crypt(p\_new\_password, public.gen\_salt('bf'))\\n    WHERE id = current\_user\_id;\\n\\n    -- 5. Return a success message\\n    RETURN json\_build\_object('success', TRUE, 'message', 'Contraseña actualizada correctamente.');\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_user\_profile",

&nbsp;   "parameters": "p\_user\_id uuid, p\_first\_name text, p\_last\_name text, p\_avatar\_url text",

&nbsp;   "return\_type": "json",

&nbsp;   "source\_code": "\\nBEGIN\\n    UPDATE public.users\\n    SET\\n        first\_name = p\_first\_name,\\n        last\_name = p\_last\_name,\\n        avatar\_url = p\_avatar\_url\\n    WHERE\\n        id = p\_user\_id;\\n\\n    RETURN json\_build\_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');\\n\\nEXCEPTION\\n    WHEN OTHERS THEN\\n        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "update\_user\_regional\_settings",

&nbsp;   "parameters": "p\_user\_id uuid, p\_country\_id uuid, p\_language\_id uuid, p\_currency\_id uuid, p\_timezone\_id uuid",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nBEGIN\\n    UPDATE public.users\\n    SET\\n        country\_id = p\_country\_id,\\n        language\_id = p\_language\_id,\\n        currency\_id = p\_currency\_id,\\n        timezone\_id = p\_timezone\_id,\\n        updated\_at = now()\\n    WHERE id = p\_user\_id;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "upsert\_integration\_provider",

&nbsp;   "parameters": "p\_id uuid, p\_name text, p\_logo\_url text, p\_country\_id uuid, p\_category\_id uuid, p\_status text, p\_endpoints jsonb, p\_config\_schema jsonb, p\_api\_schema jsonb",

&nbsp;   "return\_type": "USER-DEFINED",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- La seguridad se maneja a nivel de RLS en la tabla integration\_providers.\\n    -- Si el usuario no es superadmin, la política de INSERT/UPDATE fallará.\\n    RETURN QUERY\\n    INSERT INTO integration\_providers (\\n        id, name, logo\_url, country\_id, category\_id, status, endpoints, config\_schema, api\_schema\\n    )\\n    VALUES (\\n        COALESCE(p\_id, gen\_random\_uuid()),\\n        p\_name,\\n        p\_logo\_url,\\n        p\_country\_id,\\n        p\_category\_id,\\n        p\_status,\\n        p\_endpoints,\\n        p\_config\_schema,\\n        p\_api\_schema\\n    )\\n    ON CONFLICT (id) DO UPDATE SET\\n        name = p\_name,\\n        logo\_url = p\_logo\_url,\\n        country\_id = p\_country\_id,\\n        category\_id = p\_category\_id,\\n        status = p\_status,\\n        endpoints = p\_endpoints,\\n        config\_schema = p\_config\_schema,\\n        api\_schema = p\_api\_schema,\\n        updated\_at = NOW()\\n    RETURNING \*;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "upsert\_tenant\_integration",

&nbsp;   "parameters": "p\_tenant\_id uuid, p\_provider\_slug text, p\_encrypted\_credentials text, p\_nonce text, p\_environment text, p\_user\_role text",

&nbsp;   "return\_type": "void",

&nbsp;   "source\_code": "\\nBEGIN\\n    -- Paso 1: Verificar explícitamente el permiso del usuario.\\n    IF p\_user\_role != 'super\_admin' THEN\\n        RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super\_admin para gestionar integraciones.';\\n    END IF;\\n\\n    -- Paso 2: Realizar la operación de escritura (INSERT o UPDATE).\\n    INSERT INTO public.tenant\_integrations (\\n        tenant\_id,\\n        provider,\\n        encrypted\_credentials,\\n        nonce,\\n        environment\\n    )\\n    VALUES (\\n        p\_tenant\_id,\\n        p\_provider\_slug,\\n        p\_encrypted\_credentials,\\n        p\_nonce,\\n        p\_environment\\n    )\\n    ON CONFLICT (tenant\_id, provider, environment)\\n    DO UPDATE SET\\n        encrypted\_credentials = EXCLUDED.encrypted\_credentials,\\n        nonce = EXCLUDED.nonce,\\n        updated\_at = NOW();\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "url\_decode",

&nbsp;   "parameters": "data text",

&nbsp;   "return\_type": "bytea",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "url\_encode",

&nbsp;   "parameters": "data text",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": "\\n    SELECT string\_agg(\\n        CASE\\n            -- Caracteres no reservados que no necesitan codificación\\n            WHEN c ~ '^\[a-zA-Z0-9.\_~-]$' THEN c\\n            -- Todos los demás caracteres se codifican en formato %XX\\n            ELSE '%' || upper(to\_hex(ascii(c)))\\n        END, ''\\n    )\\n    FROM unnest(string\_to\_array(data, NULL)) AS c;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "url\_encode",

&nbsp;   "parameters": "data bytea",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "urlencode",

&nbsp;   "parameters": "string bytea, string character varying, data jsonb",

&nbsp;   "return\_type": "text",

&nbsp;   "source\_code": null

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "validate\_user\_role\_assignment",

&nbsp;   "parameters": null,

&nbsp;   "return\_type": "trigger",

&nbsp;   "source\_code": "\\nDECLARE\\n  v\_role\_name TEXT;\\nBEGIN\\n  -- Obtener el nombre del rol basado en el role\_id\\n  SELECT name INTO v\_role\_name FROM public.roles WHERE id = NEW.role\_id;\\n\\n  -- Aplicar lógica de validación basada en el nombre del rol\\n  IF v\_role\_name = 'super\_admin' THEN\\n    -- La única restricción para el super\_admin es que no puede tener una sucursal (branch) asignada.\\n    -- Se elimina la restricción sobre tenant\_id.\\n    IF NEW.branch\_id IS NOT NULL THEN\\n      RAISE EXCEPTION 'Invalid assignment: super\_admin cannot be associated with a specific branch.';\\n    END IF;\\n  ELSIF v\_role\_name = 'tenant\_super\_admin' THEN\\n    IF NEW.tenant\_id IS NULL THEN\\n      RAISE EXCEPTION 'Invalid assignment: tenant\_super\_admin must have a tenant\_id.';\\n    END IF;\\n    IF NEW.branch\_id IS NOT NULL THEN\\n      RAISE EXCEPTION 'Invalid assignment: tenant\_super\_admin cannot be associated with a specific branch.';\\n    END IF;\\n  ELSIF v\_role\_name IN ('tenant\_admin', 'tenant\_user') THEN\\n    IF NEW.tenant\_id IS NULL OR NEW.branch\_id IS NULL THEN\\n      RAISE EXCEPTION 'Invalid assignment: tenant\_admin and tenant\_user roles must have both a tenant\_id and a branch\_id.';\\n    END IF;\\n  END IF;\\n\\n  RETURN NEW;\\nEND;\\n"

&nbsp; },

&nbsp; {

&nbsp;   "routine\_schema": "public",

&nbsp;   "function\_name": "verify",

&nbsp;   "parameters": "token text, secret text, algorithm text, header json, payload json, valid boolean",

&nbsp;   "return\_type": "record",

&nbsp;   "source\_code": null

&nbsp; }

]

