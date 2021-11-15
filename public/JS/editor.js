import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";

const jscode = "";
let timer;

const evaluateCode = (code) => {
  console.clear();
  try {
    Function(code)(window);
  } catch (err) {
    console.error(err);
  }
};

let editor = new EditorView({
  state: EditorState.create({
    extensions: [
      basicSetup,
      javascript(),
      EditorView.updateListener.of((v) => {
        if (v.docChanged) {
          document
            .getElementById("Compile")
            .addEventListener("click", function () {
              evaluateCode(editor.state.doc.toString());
            });
        }
      }),
    ],
    doc: jscode,
  }),
  parent: document.body,
});
