import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElement as defineBadge } from '@ivantm0/trazo/components/trz-badge';
import { defineCustomElement as defineButton } from '@ivantm0/trazo/components/trz-button';
import { defineCustomElement as defineInput } from '@ivantm0/trazo/components/trz-input';
import { defineCustomElement as defineModal } from '@ivantm0/trazo/components/trz-modal';
import { defineCustomElement as defineSelect } from '@ivantm0/trazo/components/trz-select';
import { defineCustomElement as defineToastRegion } from '@ivantm0/trazo/components/trz-toast-region';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Solo se registran los componentes de Trazo que usa la app (el bundler descarta el resto)
[defineBadge, defineButton, defineInput, defineModal, defineSelect, defineToastRegion].forEach((define) => define());

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
