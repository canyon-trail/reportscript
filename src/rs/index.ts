type TextTemplateVariables = {
  documentPageNumber: number;
  documentPageCount: number;
  sectionPageNumber: number;
  sectionPageCount: number;
  timestamp: string;
};

type TextTemplate = {
  apply: (thisFn: any, variables: TextTemplateVariables[]) => string;
};

export function rs(templates: TemplateStringsArray, ...args): TextTemplate {
  args;

  return (variableArgs: TextTemplateVariables) => {
    const {
      documentPageCount,
      documentPageNumber,
      sectionPageCount,
      sectionPageNumber,
      timestamp,
    } = variableArgs;

    let newTemplate = templates[0];

    const variableMap = {
      "{{documentPageNumber}}": documentPageNumber,
      "{{documentPageCount}}": documentPageCount,
      "{{sectionPageNumber}}": sectionPageNumber,
      "{{sectionPageCount}}": sectionPageCount,
      "{{timestamp}}": timestamp,
    };

    const valid = Object.keys(variableMap);

    const matches = newTemplate.match(/\{\{[a-zA-Z]+\}\}/g);

    matches.forEach((x) => {
      if (!valid.includes(x)) {
        throw new Error(`${x} is not a valid variable`);
      }
    });

    valid.forEach((x) => {
      newTemplate = newTemplate.replace(x, variableMap[x]);
    });

    return newTemplate;
  };
}
