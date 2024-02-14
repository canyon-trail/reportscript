type TextTemplateVariables = {
  documentPageNumber: number;
  documentPageCount: number;
  sectionPageNumber: number;
  sectionPageCount: number;
  timestamp: string;
};

const variableKeys: Record<keyof TextTemplateVariables, boolean> = {
  documentPageCount: true,
  documentPageNumber: true,
  sectionPageCount: true,
  sectionPageNumber: true,
  timestamp: true,
};

type RenderTemplateFn = (variables: TextTemplateVariables) => string;

type TextTemplate = {
  renderTemplate: RenderTemplateFn;
};

function compileTemplate(template: string): RenderTemplateFn {
  let remaining = template;

  const parts: RenderTemplateFn[] = [];

  while (remaining.length > 0) {
    const match = /\{\{(\w+)\}\}/.exec(remaining);
    if (!match) {
      // to prevent closure from returning empty string
      const remainingVal = remaining;
      parts.push(() => remainingVal);
      remaining = "";
      continue;
    }

    const left = remaining.substring(0, match.index);

    const right = remaining.substring(match.index + match[0].length);

    const variableName = match[1];

    if (!variableKeys[variableName]) {
      throw new Error(`${match[0]} is not a valid variable`);
    }

    parts.push(() => left);
    parts.push((x) => x[variableName]);

    remaining = right;
  }

  return (variables) => {
    return parts.map((x) => x(variables)).join("");
  };
}

export function rs(
  templates: TemplateStringsArray,
  ...args: any[]
): TextTemplate {
  /*
    each of the parts of the template could potentially contain variables,
    so we normalize them to all be RenderTemplateFn
  */
  const compiledTemplates = templates.map((x) => compileTemplate(x));

  /*
    normalizing args to RenderTemplateFn[] as well, even though
    we're just ignoring the vars and returning the string value of the arg
  */
  const remainingArgs: RenderTemplateFn[] = args.map((x) => () => `${x}`);

  const output: RenderTemplateFn[] = [];

  /*
    we need to interleave the templates with the args.
    The args should always have length one less than
    the templates, hence the if statement in the loop.
  */
  while (compiledTemplates.length > 0) {
    output.push(compiledTemplates.shift());

    if (remainingArgs.length > 0) {
      output.push(remainingArgs.shift());
    }
  }

  return {
    renderTemplate: (variables: TextTemplateVariables) =>
      output.map((x) => x(variables)).join(""),
  };
}
