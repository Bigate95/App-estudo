(() => {
  const SUPABASE_URL = "https://nhrcgxrqqfenctdnbfxr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_MvREVsTHvXvI0B5dCxRC1Q_J_rKrf1U";
  const TABLE = "study_app_state";
  const ID = "default";
  const LOCAL_KEY = "controle_estudos_v4";

  const originalSetItem = localStorage.setItem.bind(localStorage);
  let updatingFromCloud = false;

  async function salvarNaNuvem(valor) {
    try {
      const dados = JSON.parse(valor);

      await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=id`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            id: ID,
            data: dados,
            updated_at: new Date().toISOString()
          })
        }
      );
    } catch (e) {
      console.log("Erro ao sincronizar:", e);
    }
  }

  async function carregarDaNuvem() {
    try {
      const resposta = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ID}&select=data`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          },
          cache: "no-store"
        }
      );

      if (!resposta.ok) return;

      const resultado = await resposta.json();

      if (resultado.length > 0 && resultado[0].data) {
        const nuvem = JSON.stringify(resultado[0].data);
        const local = localStorage.getItem(LOCAL_KEY);

        if (local !== nuvem) {
          updatingFromCloud = true;
          originalSetItem(LOCAL_KEY, nuvem);
          updatingFromCloud = false;

          location.reload();
        }
      } else {
        const local = localStorage.getItem(LOCAL_KEY);
        if (local) await salvarNaNuvem(local);
      }
    } catch (e) {
      console.log("Supabase offline:", e);
    }
  }

  localStorage.setItem = function(chave, valor) {
    originalSetItem(chave, valor);

    if (chave === LOCAL_KEY && !updatingFromCloud) {
      salvarNaNuvem(valor);
    }
  };

  carregarDaNuvem();

  setInterval(carregarDaNuvem, 3000);
})();
