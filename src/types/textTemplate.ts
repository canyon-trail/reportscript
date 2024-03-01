export type TextTemplateVariables = {
  documentPageNumber: number;
  documentPageCount: number;
  sectionPageNumber: number;
  sectionPageCount: number;
  timestamp: string;
};

export type RenderTemplateFn = (variables: TextTemplateVariables) => string;

export type TextTemplate = {
  renderTemplate: RenderTemplateFn;
};
