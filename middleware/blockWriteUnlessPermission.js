const requirePermission = require("./requirePermission");

/**
 * Block POST/PUT/PATCH/DELETE unless user has manage permission.
 * Use on route mounts where GET is guarded by *.view but writes lack route-level checks.
 */
function blockWriteUnlessPermission(managePermission) {
  const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  return (req, res, next) => {
    if (!writeMethods.has(req.method)) {
      return next();
    }
    return requirePermission(managePermission)(req, res, next);
  };
}

module.exports = blockWriteUnlessPermission;
