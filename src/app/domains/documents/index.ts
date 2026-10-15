export { AssociatedAssets } from './feature/associated-assets/associated-assets';
export { DocumentsFacade } from './data/documents.facade';
export const loadDocumentWizardPage = () =>
  import('./feature/document-wizard-page/document-wizard-page').then((m) => m.DocumentWizardPage);
