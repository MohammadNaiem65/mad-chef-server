/**
 * Removes a given field from an include parameter string.
 *
 * @param {string} includeParam - A comma-separated string of fields to include.
 * @param {string} field - The field to remove from the include parameter string.
 * @returns {string} - The filtered include parameter string after removing the given field.
 */
function removeFieldFromIncludeParam(includeParam, field) {
    return includeParam
        .split(',')
        .filter((el) => el !== field)
        .join(',');
}
