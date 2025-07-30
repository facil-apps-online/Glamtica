BEGIN;

-- Insertar la plantilla maestra de correo electrónico de Glamtica
-- Esta plantilla utiliza un diseño JSON de Unlayer para ser editable visualmente.

INSERT INTO public.email_templates (
    platform_id,
    tenant_id,
    template_type,
    name,
    subject,
    body_html,
    language_id,
    is_active,
    is_customizable,
    is_disableable
)
SELECT
    p.id AS platform_id,
    t.id AS tenant_id, -- El tenant_id del dueño de la plataforma
    'MASTER_BRANDED_TEMPLATE' AS template_type,
    'Plantilla Maestra Glamtica' AS name,
    '{{asunto_del_correo}}' AS subject,
    -- Cuerpo del correo en formato JSON de Unlayer
    '{
      "counters": {
        "u_row": 1,
        "u_column": 1,
        "u_content_image": 1,
        "u_content_text": 3,
        "u_content_button": 1
      },
      "body": {
        "rows": [
          {
            "cells": [1],
            "columns": [
              {
                "contents": [
                  {
                    "type": "image",
                    "values": {
                      "containerPadding": "10px",
                      "src": {
                        "url": "https://glamtica.app/glamtica.app.png",
                        "width": 500,
                        "height": 114
                      },
                      "textAlign": "center",
                      "altText": "Glamtica Logo",
                      "action": {
                        "name": "web",
                        "values": {
                          "href": "https://glamtica.app",
                          "target": "_blank"
                        }
                      },
                      "displayCondition": null
                    }
                  }
                ],
                "values": {
                  "_meta": {
                    "htmlID": "u_column_1",
                    "htmlClassNames": "u_column"
                  }
                }
              }
            ],
            "values": {
              "displayCondition": null,
              "columns": false,
              "backgroundColor": "#f9f9f9",
              "padding": "0px",
              "hideDesktop": false,
              "_meta": {
                "htmlID": "u_row_1",
                "htmlClassNames": "u_row"
              },
              "selectable": true,
              "draggable": true,
              "duplicatable": true,
              "deletable": true,
              "hideable": true
            }
          },
          {
            "cells": [1],
            "columns": [
              {
                "contents": [
                  {
                    "type": "text",
                    "values": {
                      "containerPadding": "10px",
                      "textAlign": "left",
                      "lineHeight": "140%",
                      "linkStyle": {
                        "inherit": true,
                        "linkColor": "#0000ee",
                        "linkHoverColor": "#0000ee",
                        "linkUnderline": true,
                        "linkHoverUnderline": true
                      },
                      "hideDesktop": false,
                      "displayCondition": null,
                      "text": "<h1 style=\"margin: 0px; line-height: 140%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: arial,helvetica,sans-serif; font-size: 26px;\">{{asunto_del_correo}}</h1>"
                    }
                  }
                ],
                "values": {}
              }
            ],
            "values": {
              "backgroundColor": "#ffffff"
            }
          },
          {
            "cells": [1],
            "columns": [
              {
                "contents": [
                  {
                    "type": "text",
                    "values": {
                      "containerPadding": "10px 30px",
                      "textAlign": "left",
                      "lineHeight": "160%",
                      "linkStyle": {},
                      "text": "<p style=\"font-size: 14px; line-height: 160%;\">{{cuerpo_del_mensaje}}</p>"
                    }
                  }
                ],
                "values": {}
              }
            ],
            "values": {
              "backgroundColor": "#ffffff"
            }
          },
          {
            "cells": [1],
            "columns": [
              {
                "contents": [
                  {
                    "type": "button",
                    "values": {
                      "containerPadding": "20px 10px 30px",
                      "href": {
                        "name": "web",
                        "values": {
                          "href": "{{url_del_boton}}",
                          "target": "_blank"
                        }
                      },
                      "buttonColors": {
                        "color": "#FFFFFF",
                        "backgroundColor": "#372537",
                        "hoverColor": "#FFFFFF",
                        "hoverBackgroundColor": "#451d35"
                      },
                      "size": {
                        "autoWidth": true,
                        "width": "100%"
                      },
                      "textAlign": "center",
                      "lineHeight": "120%",
                      "padding": "12px 25px",
                      "border": {},
                      "borderRadius": "4px",
                      "text": "{{texto_del_boton}}",
                      "displayCondition": null
                    }
                  }
                ],
                "values": {}
              }
            ],
            "values": {
              "backgroundColor": "#ffffff"
            }
          },
          {
            "cells": [1],
            "columns": [
              {
                "contents": [
                  {
                    "type": "text",
                    "values": {
                      "containerPadding": "20px",
                      "textAlign": "center",
                      "lineHeight": "140%",
                      "linkStyle": {},
                      "text": "<p style=\"font-size: 12px; line-height: 140%; color: #888888;\">© 2025 Glamtica. Todos los derechos reservados.</p>"
                    }
                  }
                ],
                "values": {}
              }
            ],
            "values": {
              "backgroundColor": "#f9f9f9"
            }
          }
        ],
        "values": {
          "textColor": "#000000",
          "backgroundColor": "#e7e7e7",
          "backgroundImage": {
            "url": "",
            "fullWidth": true,
            "repeat": false,
            "center": true,
            "cover": false
          },
          "contentWidth": "600px",
          "contentAlign": "center",
          "fontFamily": {
            "label": "Arial",
            "value": "arial,helvetica,sans-serif"
          },
          "preheaderText": "",
          "linkStyle": {
            "body": true,
            "linkColor": "#0000ee",
            "linkHoverColor": "#0000ee",
            "linkUnderline": true,
            "linkHoverUnderline": true
          },
          "hideDesktop": false
        }
      }
    }'::jsonb,
    (SELECT id FROM public.languages WHERE iso_code = 'es-CO' LIMIT 1), -- CORREGIDO: Usar el iso_code correcto
    true, -- is_active
    true, -- is_customizable
    true  -- is_disableable
FROM
    public.platforms p
JOIN
    public.tenants t ON p.id = t.platform_id
WHERE
    p.name = 'Glamtica' AND t.is_system_owner = true;

COMMIT;